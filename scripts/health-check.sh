#!/bin/bash
echo "🔍 RedPill VC Health Check..."
echo "================================"

# Check if processes are running
echo "📊 Process Status:"
BACKEND_RUNNING=$(ps aux | grep "uvicorn" | grep -v grep | wc -l)
FRONTEND_RUNNING=$(ps aux | grep "next dev" | grep -v grep | wc -l)

if [ $BACKEND_RUNNING -gt 0 ]; then
    echo "✅ Backend process: RUNNING"
else
    echo "❌ Backend process: NOT RUNNING"
fi

if [ $FRONTEND_RUNNING -gt 0 ]; then
    echo "✅ Frontend process: RUNNING"
else
    echo "❌ Frontend process: NOT RUNNING"
fi

echo ""
echo "🌐 Connectivity Status:"

# Check Backend Health
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend health: http://localhost:8000"
    
    # Get health details
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
    echo "   Status: $(echo $HEALTH_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)"
else
    echo "❌ Backend health: DOWN or unreachable"
fi

# Check Frontend
if curl -s -I http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend: http://localhost:3000"
else
    echo "❌ Frontend: DOWN or unreachable"
fi

echo ""
echo "🔌 API Endpoints:"

# Check Workflows API
if curl -s "http://localhost:8000/api/v1/workflows/summary" > /dev/null 2>&1; then
    echo "✅ Workflows API: Working"
    
    # Get workflow stats
    WORKFLOW_STATS=$(curl -s "http://localhost:8000/api/v1/workflows/summary")
    TOTAL_WORKFLOWS=$(echo $WORKFLOW_STATS | grep -o '"total_workflows":[^,]*' | cut -d':' -f2)
    echo "   Total workflows: $TOTAL_WORKFLOWS"
else
    echo "❌ Workflows API: Failed"
fi

# Check Database
echo ""
echo "💾 Database Status:"
if [ -f "/Users/marvin/redpill-project/backend/redpill.db" ]; then
    DB_SIZE=$(ls -lh /Users/marvin/redpill-project/backend/redpill.db | awk '{print $5}')
    echo "✅ SQLite database: $DB_SIZE"
else
    echo "❌ SQLite database: File not found"
fi

# Check Configuration
echo ""
echo "⚙️  Configuration:"
cd /Users/marvin/redpill-project/backend
DB_CONFIG=$(grep "database_url" app/config.py | grep -o 'sqlite://.*' || echo "Not SQLite")
if [[ $DB_CONFIG == sqlite* ]]; then
    echo "✅ Database config: SQLite (correct)"
else
    echo "❌ Database config: $DB_CONFIG (should be SQLite)"
fi

# Port usage
echo ""
echo "🚪 Port Usage:"
PORT_8000=$(lsof -ti:8000 2>/dev/null | wc -l | tr -d ' ')
PORT_3000=$(lsof -ti:3000 2>/dev/null | wc -l | tr -d ' ')

if [ $PORT_8000 -gt 0 ]; then
    echo "✅ Port 8000: In use (backend)"
else
    echo "❌ Port 8000: Free (backend not running)"
fi

if [ $PORT_3000 -gt 0 ]; then
    echo "✅ Port 3000: In use (frontend)"
else
    echo "❌ Port 3000: Free (frontend not running)"
fi

# Overall Status
echo ""
echo "🎯 Overall Status:"
if [ $BACKEND_RUNNING -gt 0 ] && [ $FRONTEND_RUNNING -gt 0 ] && curl -s http://localhost:8000/health > /dev/null 2>&1 && curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "🟢 ALL SYSTEMS OPERATIONAL"
    echo ""
    echo "🔗 Access URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
else
    echo "🔴 SOME ISSUES DETECTED"
    echo ""
    echo "💡 Troubleshooting:"
    echo "   • Run: ./scripts/start-services.sh"
    echo "   • Check logs: tail /tmp/redpill-*.log"
    echo "   • See: SETUP_GUIDE.md"
fi

echo "================================"