#!/bin/bash

# Start frontend development server
set -e

echo "🎨 Starting Redpill VC CRM Frontend Development Server"

# Check if backend is running
if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "⚠️  Backend is not running. Starting development environment..."
    ./scripts/dev-setup.sh
fi

# Navigate to frontend directory
cd suna/frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start development server
echo "🚀 Starting frontend development server..."
npm run dev