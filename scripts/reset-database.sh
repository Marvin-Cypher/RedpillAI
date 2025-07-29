#!/bin/bash
echo "🗄️  RedPill VC Database Reset..."
echo "================================"

# Confirm action
read -p "⚠️  This will delete all data. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Database reset cancelled"
    exit 1
fi

# Stop services first
echo "🛑 Stopping services..."
./scripts/stop-services.sh > /dev/null 2>&1

# Backup existing database
DB_PATH="/Users/marvin/redpill-project/backend/redpill.db"
if [ -f "$DB_PATH" ]; then
    BACKUP_NAME="redpill_backup_$(date +%Y%m%d_%H%M%S).db"
    echo "💾 Backing up database to: $BACKUP_NAME"
    cp "$DB_PATH" "/Users/marvin/redpill-project/backend/$BACKUP_NAME"
fi

# Remove old database
echo "🗑️  Removing old database..."
rm -f "$DB_PATH"

# Remove alembic version tracking (if exists)
rm -f "/Users/marvin/redpill-project/backend/alembic/versions/*.py" 2>/dev/null

echo "✅ Database reset complete"
echo ""
echo "🚀 Starting services to recreate database..."

# Start services to recreate database
./scripts/start-services.sh

echo ""
echo "💡 Database has been reset with fresh schema"
echo "🔄 You can now test with clean data"