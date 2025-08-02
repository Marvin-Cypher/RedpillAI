"""Archive service for managing data retention and cleanup."""

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlmodel import Session, select, delete
import logging

from ..database import engine
from ..models.conversations import Message
from ..models.cache import CompanyDataCache, ApiUsageLog


class ArchiveService:
    """
    Service for archiving old data and managing retention policies.
    
    Handles:
    - Message archival (older than cutoff_days)  
    - Cache cleanup (expired entries)
    - API usage log rotation
    - Analytics data compression
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Default retention policies (in days)
        self.retention_policies = {
            'messages': 180,          # 6 months
            'api_usage_logs': 90,     # 3 months  
            'expired_cache': 30,      # 1 month after expiration
            'analytics': 365          # 1 year
        }
    
    async def archive_old_messages(self, cutoff_days: int = 180) -> Dict[str, Any]:
        """
        Archive messages older than cutoff_days.
        
        Returns statistics about archived messages.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=cutoff_days)
        
        self.logger.info(f"Starting message archival for messages older than {cutoff_date}")
        
        with Session(engine) as session:
            # Find messages to archive
            messages_to_archive = session.exec(
                select(Message).where(
                    Message.created_at < cutoff_date,
                    Message.archived_at.is_(None)  # Not already archived
                )
            ).all()
            
            archived_count = 0
            
            # Mark messages as archived (soft delete)
            for message in messages_to_archive:
                message.archived_at = datetime.utcnow()
                session.add(message)
                archived_count += 1
            
            # Commit the archival
            session.commit()
            
            stats = {
                'operation': 'archive_messages',
                'cutoff_date': cutoff_date.isoformat(),
                'messages_archived': archived_count,
                'completed_at': datetime.utcnow().isoformat()
            }
            
            self.logger.info(f"Archived {archived_count} messages older than {cutoff_days} days")
            return stats
    
    async def cleanup_expired_cache(self, grace_period_days: int = 30) -> Dict[str, Any]:
        """
        Clean up cache entries that have been expired for more than grace_period_days.
        
        This is a hard delete operation - data will be permanently removed.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=grace_period_days)
        
        self.logger.info(f"Starting expired cache cleanup for entries expired before {cutoff_date}")
        
        with Session(engine) as session:
            # Count entries to be deleted
            entries_to_delete = session.exec(
                select(CompanyDataCache).where(
                    CompanyDataCache.expires_at < cutoff_date
                )
            ).all()
            
            delete_count = len(entries_to_delete)
            
            # Delete expired cache entries
            if delete_count > 0:
                session.exec(
                    delete(CompanyDataCache).where(
                        CompanyDataCache.expires_at < cutoff_date
                    )
                )
                session.commit()
            
            stats = {
                'operation': 'cleanup_expired_cache',
                'cutoff_date': cutoff_date.isoformat(),
                'entries_deleted': delete_count,
                'completed_at': datetime.utcnow().isoformat()
            }
            
            self.logger.info(f"Deleted {delete_count} expired cache entries")
            return stats
    
    async def rotate_api_usage_logs(self, retention_days: int = 90) -> Dict[str, Any]:
        """
        Rotate API usage logs, keeping only the last retention_days.
        
        This helps manage database size while preserving recent usage patterns.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        
        self.logger.info(f"Starting API usage log rotation for logs older than {cutoff_date}")
        
        with Session(engine) as session:
            # Count logs to be deleted
            logs_to_delete = session.exec(
                select(ApiUsageLog).where(
                    ApiUsageLog.created_at < cutoff_date
                )
            ).all()
            
            delete_count = len(logs_to_delete)
            
            # Delete old API usage logs
            if delete_count > 0:
                session.exec(
                    delete(ApiUsageLog).where(
                        ApiUsageLog.created_at < cutoff_date
                    )
                )
                session.commit()
            
            stats = {
                'operation': 'rotate_api_usage_logs',
                'cutoff_date': cutoff_date.isoformat(),
                'logs_deleted': delete_count,
                'completed_at': datetime.utcnow().isoformat()
            }
            
            self.logger.info(f"Deleted {delete_count} old API usage logs")
            return stats
    
    async def get_archival_candidates(self) -> Dict[str, Any]:
        """
        Get statistics on data that could be archived without running archival.
        
        Useful for monitoring and planning archival operations.
        """
        with Session(engine) as session:
            candidates = {}
            
            # Messages candidates
            cutoff_date = datetime.utcnow() - timedelta(days=self.retention_policies['messages'])
            message_candidates = session.exec(
                select(Message).where(
                    Message.created_at < cutoff_date,
                    Message.archived_at.is_(None)
                )
            ).all()
            
            candidates['messages'] = {
                'count': len(message_candidates),
                'cutoff_date': cutoff_date.isoformat(),
                'retention_days': self.retention_policies['messages']
            }
            
            # Expired cache candidates
            cache_cutoff = datetime.utcnow() - timedelta(days=self.retention_policies['expired_cache'])
            cache_candidates = session.exec(
                select(CompanyDataCache).where(
                    CompanyDataCache.expires_at < cache_cutoff
                )
            ).all()
            
            candidates['expired_cache'] = {
                'count': len(cache_candidates),
                'cutoff_date': cache_cutoff.isoformat(),
                'retention_days': self.retention_policies['expired_cache']
            }
            
            # API usage log candidates
            api_cutoff = datetime.utcnow() - timedelta(days=self.retention_policies['api_usage_logs'])
            api_candidates = session.exec(
                select(ApiUsageLog).where(
                    ApiUsageLog.created_at < api_cutoff
                )
            ).all()
            
            candidates['api_usage_logs'] = {
                'count': len(api_candidates),
                'cutoff_date': api_cutoff.isoformat(),
                'retention_days': self.retention_policies['api_usage_logs']
            }
            
            return {
                'operation': 'get_archival_candidates',
                'candidates': candidates,
                'generated_at': datetime.utcnow().isoformat()
            }
    
    async def run_full_archival_cycle(self) -> Dict[str, Any]:
        """
        Run a complete archival cycle with all operations.
        
        This is the main method to be called by scheduled tasks.
        """
        self.logger.info("Starting full archival cycle")
        
        cycle_start = datetime.utcnow()
        results = {}
        
        try:
            # 1. Archive old messages
            results['messages'] = await self.archive_old_messages(
                self.retention_policies['messages']
            )
            
            # 2. Clean up expired cache
            results['expired_cache'] = await self.cleanup_expired_cache(
                self.retention_policies['expired_cache']
            )
            
            # 3. Rotate API usage logs
            results['api_usage_logs'] = await self.rotate_api_usage_logs(
                self.retention_policies['api_usage_logs']
            )
            
            cycle_end = datetime.utcnow()
            duration = (cycle_end - cycle_start).total_seconds()
            
            summary = {
                'operation': 'full_archival_cycle',
                'started_at': cycle_start.isoformat(),
                'completed_at': cycle_end.isoformat(),
                'duration_seconds': duration,
                'results': results,
                'status': 'success'
            }
            
            self.logger.info(f"Full archival cycle completed in {duration:.2f} seconds")
            return summary
            
        except Exception as e:
            error_summary = {
                'operation': 'full_archival_cycle',
                'started_at': cycle_start.isoformat(),
                'failed_at': datetime.utcnow().isoformat(),
                'error': str(e),
                'partial_results': results,
                'status': 'failed'
            }
            
            self.logger.error(f"Full archival cycle failed: {e}")
            return error_summary


# Global service instance
archive_service = ArchiveService()