#!/bin/bash

# Reset development environment
set -e

echo "🔄 Resetting Redpill VC CRM Development Environment"

# Stop all services
echo "🛑 Stopping all services..."
docker-compose -f docker-compose.dev.yml down

# Remove volumes to reset data
echo "🗑️  Removing data volumes..."
docker volume rm redpill-project_postgres_data 2>/dev/null || true
docker volume rm redpill-project_redis_data 2>/dev/null || true

# Restart services
echo "🚀 Restarting services..."
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
sleep 10

# Start backend
docker-compose -f docker-compose.dev.yml up -d backend

# Wait for backend
echo "⏳ Waiting for backend..."
sleep 5

# Reseed database
echo "🌱 Reseeding database..."
docker-compose -f docker-compose.dev.yml exec backend python -m app.seed_data

echo "✅ Development environment reset complete!"