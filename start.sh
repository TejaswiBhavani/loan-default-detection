#!/bin/bash

# Loan Prediction Application Startup Script
echo "🚀 Starting Loan Prediction Application..."

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Start backend API in background
echo "📡 Starting Backend API..."
cd /workspaces/loan-default-detection
node mock-api.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend in background
echo "🌐 Starting Frontend..."
cd /workspaces/loan-default-detection/loan-prediction-frontend
npm start &
FRONTEND_PID=$!

# Wait for frontend to compile
echo "⏳ Waiting for servers to start..."
sleep 15

echo ""
echo "🎉 Application is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "📡 Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Keep script running
wait