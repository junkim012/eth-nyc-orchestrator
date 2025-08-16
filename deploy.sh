#!/bin/bash

# Deployment script for USDC to pyUSD Orchestrator

echo "🚀 Deploying Orchestrator Service..."

# Build the project
echo "📦 Building TypeScript..."
npm run build

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one from .env.example"
    exit 1
fi

# Check if PocketBase is accessible
echo "🔍 Checking PocketBase connection..."
if ! curl -f "${POCKETBASE_URL:-http://localhost:8090}/api/health" >/dev/null 2>&1; then
    echo "⚠️  Warning: PocketBase may not be accessible at ${POCKETBASE_URL:-http://localhost:8090}"
fi

# Start the service
echo "🎯 Starting Orchestrator service..."
if [ "$1" = "docker" ]; then
    echo "🐳 Building and running Docker container..."
    docker build -t orchestrator .
    docker run -p 3000:3000 --env-file .env orchestrator
else
    echo "🔧 Running locally..."
    npm start
fi