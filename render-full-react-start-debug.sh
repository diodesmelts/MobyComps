#!/bin/bash
set -e

# Display environment info
echo "=== STARTING FULL REACT APPLICATION WITH DEBUG ==="
echo "Node version: $(node -v)"
echo "Environment: ${NODE_ENV:-production}"
echo "Current directory: $(pwd)"

# Verify directory structure
echo "Filesystem contents:"
find . -type f -name "*.js" | sort
find . -type d | sort

# Check for server.js
if [ -f "server.js" ]; then
  echo "Found server.js - starting server with verbose logging..."
  
  # Set environment variables
  export DEBUG=true
  export NODE_ENV=production
  export PORT=${PORT:-10000}

  # Apply executable permissions to needed scripts
  chmod +x server.js 2>/dev/null || true
  
  # Start the server with detailed logging
  node --trace-warnings server.js
else
  echo "ERROR: server.js not found"
  exit 1
fi