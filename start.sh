#!/bin/bash

# Check if dist/index.js exists
if [ ! -f "dist/index.js" ]; then
  echo "Error: dist/index.js not found. Build may have failed."
  # List directory contents for debugging
  echo "Contents of current directory:"
  ls -la
  echo "Contents of dist directory (if it exists):"
  ls -la dist 2>/dev/null || echo "dist directory not found"
  exit 1
fi

# Start the application
echo "Starting application in production mode..."
NODE_ENV=production node dist/index.js