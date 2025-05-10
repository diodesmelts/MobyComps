#!/bin/bash
set -e

echo "=== STARTING SIMPLIFIED SERVER ==="
echo "Node version: $(node -v)"
echo "Environment: ${NODE_ENV:-production}"
echo "Current directory: $(pwd)"

# Check for server.js
if [ -f "server.js" ]; then
  echo "Found server.js - starting server..."
  
  # Set environment variables
  export NODE_ENV=production
  export PORT=${PORT:-10000}
  
  # Start the server
  node server.js
else
  echo "ERROR: server.js not found"
  exit 1
fi