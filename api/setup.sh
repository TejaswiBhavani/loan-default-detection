#!/bin/bash

# Quick Start Script for Loan Prediction API

echo "========================================"
echo "Loan Prediction API - Quick Start"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Navigate to API directory
cd "$(dirname "$0")"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your database credentials!"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check if PostgreSQL is accessible
echo "🔍 Checking database connection..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
else
    echo "⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed."
fi

echo ""
echo "========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your database credentials"
echo "2. Ensure PostgreSQL is running"
echo "3. Run database migrations (see ../database/migrations)"
echo "4. Start the server: npm run dev"
echo ""
echo "To start the server now, run:"
echo "  npm run dev"
echo ""
