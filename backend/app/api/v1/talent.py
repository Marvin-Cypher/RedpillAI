"""
Talent Intelligence API endpoints
Handles talent profiles, achievements, platform profiles, and data sources
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime, timedelta

from ...database import get_session
from ...models import (
    TalentProfile, TalentProfileCreate, TalentProfileUpdate, TalentProfileRead,
    PersonProfessional, PersonProfessionalCreate, PersonProfessionalUpdate, PersonProfessionalRead,
    Achievement, AchievementCreate, AchievementUpdate, AchievementRead,
    PlatformProfile, PlatformProfileCreate, PlatformProfileUpdate, PlatformProfileRead,
    DataSource, DataSourceCreate, DataSourceUpdate, DataSourceRead,
    TALENT_CATEGORIES, ACHIEVEMENT_TYPES, PLATFORM_TYPES, VERIFICATION_STATUS,
    Person, Company
)
from ...core.auth import get_current_user_optional
from ...models.users import User

router = APIRouter()


# Talent Profile Management
@router.get("/profiles/", response_model=List[TalentProfileRead])
def list_talent_profiles(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    is_talent: Optional[bool] = Query(None, description="Filter by talent status"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum talent score"),
    category: Optional[str] = Query(None, description="Filter by talent category"),
    suggested_by_ai: Optional[bool] = Query(None, description="Filter AI suggestions"),
    skip: int = Query(0, ge=0, description="Number of profiles to skip"),
    limit: int = Query(100, le=1000, description="Number of profiles to return")
):
    """List talent profiles with filtering options."""
    query = select(TalentProfile)
    
    if is_talent is not None:
        query = query.where(TalentProfile.is_talent == is_talent)
    
    if min_score is not None:
        query = query.where(TalentProfile.talent_score >= min_score)
    
    if suggested_by_ai is not None:
        query = query.where(TalentProfile.suggested_by_ai == suggested_by_ai)
    
    # TODO: Add category filtering when talent_categories is properly indexed
    
    query = query.order_by(TalentProfile.talent_score.desc()).offset(skip).limit(limit)
    profiles = session.exec(query).all()
    
    return profiles


@router.get("/profiles/categories", response_model=dict)
def get_talent_categories():
    """Get available talent categories."""
    return {"categories": TALENT_CATEGORIES}


@router.get("/profiles/{person_id}", response_model=TalentProfileRead)
def get_talent_profile(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str
):
    """Get talent profile for a specific person."""
    profile = session.get(TalentProfile, person_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Talent profile not found")
    
    return profile


@router.post("/profiles/{person_id}", response_model=TalentProfileRead)
def create_or_update_talent_profile(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str,
    profile_in: TalentProfileCreate
):
    """Create or update talent profile for a person."""
    # Verify person exists
    person = session.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Check if profile already exists
    existing_profile = session.get(TalentProfile, person_id)
    
    if existing_profile:
        # Update existing profile
        profile_data = profile_in.dict(exclude_unset=True)
        profile_data["updated_at"] = datetime.utcnow()
        if current_user:
            profile_data["classified_by"] = current_user.id
            profile_data["classified_at"] = datetime.utcnow()
        
        for field, value in profile_data.items():
            setattr(existing_profile, field, value)
        
        session.add(existing_profile)
        session.commit()
        session.refresh(existing_profile)
        return existing_profile
    else:
        # Create new profile
        profile_data = profile_in.dict()
        profile_data["person_id"] = person_id
        profile_data["created_at"] = datetime.utcnow()
        profile_data["updated_at"] = datetime.utcnow()
        
        if current_user:
            profile_data["classified_by"] = current_user.id
            profile_data["classified_at"] = datetime.utcnow()
        
        profile = TalentProfile(**profile_data)
        session.add(profile)
        session.commit()
        session.refresh(profile)
        return profile


@router.put("/profiles/{person_id}", response_model=TalentProfileRead)
def update_talent_profile(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str,
    profile_in: TalentProfileUpdate
):
    """Update talent profile for a person."""
    profile = session.get(TalentProfile, person_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Talent profile not found")
    
    profile_data = profile_in.dict(exclude_unset=True)
    profile_data["updated_at"] = datetime.utcnow()
    
    # If talent status is being changed, track who changed it
    if profile_in.is_talent is not None and current_user:
        profile_data["classified_by"] = current_user.id
        profile_data["classified_at"] = datetime.utcnow()
    
    for field, value in profile_data.items():
        setattr(profile, field, value)
    
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile


@router.delete("/profiles/{person_id}")
def delete_talent_profile(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str
):
    """Delete talent profile for a person."""
    profile = session.get(TalentProfile, person_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Talent profile not found")
    
    session.delete(profile)
    session.commit()
    return {"message": "Talent profile deleted successfully"}


# Talent Discovery and Suggestions
@router.get("/suggestions/", response_model=List[TalentProfileRead])
def get_talent_suggestions(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    min_confidence: float = Query(0.7, ge=0, le=1, description="Minimum AI confidence score"),
    category: Optional[str] = Query(None, description="Filter by talent category"),
    limit: int = Query(50, le=200, description="Number of suggestions to return")
):
    """Get AI-suggested talent candidates."""
    query = select(TalentProfile).where(
        TalentProfile.suggested_by_ai == True,
        TalentProfile.is_talent == False,  # Not yet classified as talent
        TalentProfile.suggestion_confidence >= min_confidence
    )
    
    # TODO: Add category filtering
    
    query = query.order_by(TalentProfile.suggestion_confidence.desc()).limit(limit)
    suggestions = session.exec(query).all()
    
    return suggestions


@router.post("/suggestions/{person_id}/approve")
def approve_talent_suggestion(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str,
    manual_classification: Optional[str] = None
):
    """Approve an AI talent suggestion."""
    profile = session.get(TalentProfile, person_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Talent profile not found")
    
    if not profile.suggested_by_ai:
        raise HTTPException(status_code=400, detail="Profile was not suggested by AI")
    
    # Approve the suggestion
    profile.is_talent = True
    profile.classified_by = current_user.id if current_user else None
    profile.classified_at = datetime.utcnow()
    profile.updated_at = datetime.utcnow()
    
    if manual_classification:
        profile.manual_classification = manual_classification
    
    session.add(profile)
    session.commit()
    session.refresh(profile)
    
    return {"message": "Talent suggestion approved", "profile": profile}


@router.post("/suggestions/{person_id}/reject")
def reject_talent_suggestion(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str,
    reason: Optional[str] = None
):
    """Reject an AI talent suggestion."""
    profile = session.get(TalentProfile, person_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Talent profile not found")
    
    if not profile.suggested_by_ai:
        raise HTTPException(status_code=400, detail="Profile was not suggested by AI")
    
    # Mark as reviewed but not talent
    profile.is_talent = False
    profile.classified_by = current_user.id if current_user else None
    profile.classified_at = datetime.utcnow()
    profile.updated_at = datetime.utcnow()
    
    if reason:
        profile.manual_classification = f"Rejected: {reason}"
    
    session.add(profile)
    session.commit()
    
    return {"message": "Talent suggestion rejected"}


# Professional Profiles
@router.get("/professional/{person_id}", response_model=PersonProfessionalRead)
def get_professional_profile(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str
):
    """Get professional profile for a person."""
    query = select(PersonProfessional).where(PersonProfessional.person_id == person_id)
    profile = session.exec(query).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    return profile


@router.post("/professional/", response_model=PersonProfessionalRead)
def create_professional_profile(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    profile_in: PersonProfessionalCreate
):
    """Create professional profile for a person."""
    # Verify person exists
    person = session.get(Person, profile_in.person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Check if profile already exists
    existing = session.exec(
        select(PersonProfessional).where(PersonProfessional.person_id == profile_in.person_id)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Professional profile already exists for this person")
    
    profile_data = profile_in.dict()
    profile_data["created_at"] = datetime.utcnow()
    profile_data["updated_at"] = datetime.utcnow()
    
    profile = PersonProfessional(**profile_data)
    session.add(profile)
    session.commit()
    session.refresh(profile)
    
    return profile


@router.put("/professional/{person_id}", response_model=PersonProfessionalRead)
def update_professional_profile(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str,
    profile_in: PersonProfessionalUpdate
):
    """Update professional profile for a person."""
    query = select(PersonProfessional).where(PersonProfessional.person_id == person_id)
    profile = session.exec(query).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Professional profile not found")
    
    profile_data = profile_in.dict(exclude_unset=True)
    profile_data["updated_at"] = datetime.utcnow()
    
    for field, value in profile_data.items():
        setattr(profile, field, value)
    
    session.add(profile)
    session.commit()
    session.refresh(profile)
    
    return profile


# Achievements
@router.get("/achievements/", response_model=List[AchievementRead])
def list_achievements(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: Optional[str] = Query(None, description="Filter by person ID"),
    achievement_type: Optional[str] = Query(None, description="Filter by achievement type"),
    verification_status: Optional[str] = Query(None, description="Filter by verification status"),
    verified_only: bool = Query(False, description="Show only verified achievements"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000)
):
    """List achievements with filtering."""
    query = select(Achievement)
    
    if person_id:
        query = query.where(Achievement.person_id == person_id)
    
    if achievement_type:
        query = query.where(Achievement.achievement_type == achievement_type)
    
    if verification_status:
        query = query.where(Achievement.verification_status == verification_status)
    elif verified_only:
        query = query.where(Achievement.verification_status == "VERIFIED")
    
    query = query.order_by(Achievement.date_achieved.desc()).offset(skip).limit(limit)
    achievements = session.exec(query).all()
    
    return achievements


@router.get("/achievements/types", response_model=dict)
def get_achievement_types():
    """Get available achievement types."""
    return {
        "types": ACHIEVEMENT_TYPES,
        "verification_statuses": VERIFICATION_STATUS
    }


@router.post("/achievements/", response_model=AchievementRead)
def create_achievement(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    achievement_in: AchievementCreate
):
    """Create a new achievement."""
    # Validate achievement type
    if achievement_in.achievement_type not in ACHIEVEMENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid achievement type. Must be one of: {list(ACHIEVEMENT_TYPES.keys())}"
        )
    
    # Verify person exists
    person = session.get(Person, achievement_in.person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    achievement_data = achievement_in.dict()
    achievement_data["created_at"] = datetime.utcnow()
    achievement_data["updated_at"] = datetime.utcnow()
    
    achievement = Achievement(**achievement_data)
    session.add(achievement)
    session.commit()
    session.refresh(achievement)
    
    return achievement


# Platform Profiles
@router.get("/platforms/types", response_model=dict)
def get_platform_types():
    """Get available platform types."""
    return {"platforms": PLATFORM_TYPES}


@router.get("/platforms/{person_id}", response_model=List[PlatformProfileRead])
def get_person_platform_profiles(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str,
    platform: Optional[str] = Query(None, description="Filter by platform")
):
    """Get all platform profiles for a person."""
    person = session.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    query = select(PlatformProfile).where(PlatformProfile.person_id == person_id)
    
    if platform:
        query = query.where(PlatformProfile.platform == platform)
    
    profiles = session.exec(query).all()
    return profiles


@router.post("/platforms/", response_model=PlatformProfileRead)
def create_platform_profile(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    profile_in: PlatformProfileCreate
):
    """Create a platform profile."""
    # Validate platform type
    if profile_in.platform not in PLATFORM_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid platform. Must be one of: {list(PLATFORM_TYPES.keys())}"
        )
    
    # Verify person exists
    person = session.get(Person, profile_in.person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Check for duplicate platform profile
    existing = session.exec(
        select(PlatformProfile).where(
            PlatformProfile.person_id == profile_in.person_id,
            PlatformProfile.platform == profile_in.platform
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Platform profile for {profile_in.platform} already exists for this person"
        )
    
    profile_data = profile_in.dict()
    profile_data["created_at"] = datetime.utcnow()
    profile_data["updated_at"] = datetime.utcnow()
    
    profile = PlatformProfile(**profile_data)
    session.add(profile)
    session.commit()
    session.refresh(profile)
    
    return profile


# Data Sources
@router.get("/data-sources/", response_model=List[DataSourceRead])
def list_data_sources(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    source_type: Optional[str] = Query(None, description="Filter by source type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000)
):
    """List data sources."""
    query = select(DataSource)
    
    if source_type:
        query = query.where(DataSource.source_type == source_type)
    
    if is_active is not None:
        query = query.where(DataSource.is_active == is_active)
    
    query = query.offset(skip).limit(limit)
    sources = session.exec(query).all()
    
    return sources


@router.post("/data-sources/", response_model=DataSourceRead)
def create_data_source(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    source_in: DataSourceCreate
):
    """Create a new data source."""
    source_data = source_in.dict()
    source_data["created_at"] = datetime.utcnow()
    source_data["updated_at"] = datetime.utcnow()
    
    source = DataSource(**source_data)
    session.add(source)
    session.commit()
    session.refresh(source)
    
    return source


# Talent Search and Discovery
@router.get("/search/", response_model=List[TalentProfileRead])
def search_talent(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    query_text: str = Query(..., description="Search query"),
    categories: Optional[List[str]] = Query(None, description="Filter by talent categories"),
    min_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum talent score"),
    limit: int = Query(50, le=200)
):
    """Search talent database with semantic queries."""
    # Basic implementation - can be enhanced with full-text search later
    query = select(TalentProfile).where(TalentProfile.is_talent == True)
    
    if min_score is not None:
        query = query.where(TalentProfile.talent_score >= min_score)
    
    # TODO: Implement full-text search on achievement_summary, manual_classification
    # TODO: Add category filtering
    
    query = query.order_by(TalentProfile.talent_score.desc()).limit(limit)
    results = session.exec(query).all()
    
    return results