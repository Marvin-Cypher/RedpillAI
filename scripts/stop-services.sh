#!/bin/bash
echo "🛑 Stopping RedPill VC Services..."

# Kill backend processes
BACKEND_PIDS=$(ps aux | grep "uvicorn.*redpill" | grep -v grep | awk '{print $2}')
if [ ! -z "$BACKEND_PIDS" ]; then
    echo "Stopping backend processes: $BACKEND_PIDS"
    kill $BACKEND_PIDS 2>/dev/null
else
    echo "No backend processes found"
fi

# Kill frontend processes  
FRONTEND_PIDS=$(ps aux | grep "next dev" | grep -v grep | awk '{print $2}')
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "Stopping frontend processes: $FRONTEND_PIDS"
    kill $FRONTEND_PIDS 2>/dev/null
else
    echo "No frontend processes found"
fi

# Wait for processes to stop
sleep 2

# Force kill if still running
pkill -f "uvicorn" 2>/dev/null
pkill -f "next dev" 2>/dev/null

# Clean up log files
rm -f /tmp/redpill-backend.log /tmp/redpill-frontend.log

echo "✅ All services stopped"

# Verify nothing is running
REMAINING=$(ps aux | grep -E "(uvicorn|next dev)" | grep -v grep | wc -l)
if [ $REMAINING -gt 0 ]; then
    echo "⚠️  Warning: Some processes may still be running:"
    ps aux | grep -E "(uvicorn|next dev)" | grep -v grep
else
    echo "🔍 Verified: All processes stopped"
fi