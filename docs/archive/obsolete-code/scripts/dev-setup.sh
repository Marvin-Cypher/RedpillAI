#!/bin/bash

# Redpill VC CRM Development Environment Setup
set -e

echo "🚀 Setting up Redpill VC CRM Development Environment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

# Remove old volumes (optional - comment out to keep data)
echo "🗑️  Cleaning up old data..."
docker volume rm redpill-project_postgres_data 2>/dev/null || true
docker volume rm redpill-project_redis_data 2>/dev/null || true

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Build backend
echo "🔨 Building backend..."
docker-compose -f docker-compose.dev.yml build backend

# Start backend
echo "🚀 Starting backend..."
docker-compose -f docker-compose.dev.yml up -d backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Seed database
echo "🌱 Seeding database with sample data..."
docker-compose -f docker-compose.dev.yml exec backend python -m app.seed_data

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📊 Services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379" 
echo "  - Backend API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo ""
echo "🎯 Next steps:"
echo "  1. Start frontend: cd suna/frontend && npm run dev"
echo "  2. Open app: http://localhost:3004"
echo ""
echo "🔧 Development commands:"
echo "  - View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "  - Stop all: docker-compose -f docker-compose.dev.yml down"
echo "  - Reset data: ./scripts/dev-reset.sh"