#!/bin/bash
echo "🚀 Starting RedPill VC Services..."

# Kill existing processes
echo "Stopping existing services..."
pkill -f "uvicorn" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start Backend
echo "Starting backend..."
cd /Users/marvin/redpill-project/backend

# Verify database configuration
if ! grep -q "sqlite:///./redpill.db" app/config.py; then
    echo "⚠️  Warning: Database might not be configured for SQLite"
    echo "Current config:"
    grep "database_url" app/config.py
fi

# Start backend
python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 > /tmp/redpill-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start Frontend  
echo "Starting frontend..."
cd /Users/marvin/redpill-project/frontend

# Verify package.json has dev script
if ! grep -q '"dev"' package.json; then
    echo "❌ Error: package.json missing dev script"
    exit 1
fi

# Start frontend
npm run dev > /tmp/redpill-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
echo "Waiting for frontend to start..."
sleep 8

# Verify services
echo ""
echo "🔍 Verifying services..."

# Check backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend: http://localhost:8000"
    # Test API
    if curl -s "http://localhost:8000/api/v1/workflows/summary" > /dev/null 2>&1; then
        echo "✅ API: Workflows endpoint working"
    else
        echo "⚠️  API: Workflows endpoint may have issues"
    fi
else
    echo "❌ Backend: FAILED to start"
    echo "Check logs: tail /tmp/redpill-backend.log"
fi

# Check frontend
if curl -s -I http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend: http://localhost:3000"
else
    echo "❌ Frontend: FAILED to start"
    echo "Check logs: tail /tmp/redpill-frontend.log"
fi

echo ""
echo "📋 Service Status:"
echo "Backend logs: tail -f /tmp/redpill-backend.log"
echo "Frontend logs: tail -f /tmp/redpill-frontend.log"
echo ""
echo "🎉 Setup complete! Open http://localhost:3000"
echo "💡 Use './scripts/health-check.sh' to verify services anytime"