#!/bin/bash

# Start server in background if not already running
if ! lsof -i:8080 > /dev/null 2>&1; then
  echo "Starting server on port 8080..."
  python3 -m http.server 8080 &
  SERVER_PID=$!
  sleep 2
  CLEANUP_SERVER=true
else
  echo "Server already running on port 8080"
  CLEANUP_SERVER=false
fi

# Ensure Node.js is available
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run tests
echo -e "\n🧪 Running Evolution Tests...\n"
node runTests.js

# Cleanup
if [ "$CLEANUP_SERVER" = true ]; then
  echo -e "\nStopping server..."
  kill $SERVER_PID
fi
