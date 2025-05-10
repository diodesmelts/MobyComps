#!/bin/bash
# Start script for the FULL React app deployment

cd dist
echo "=== STARTING FULL REACT APPLICATION ==="
echo "Node version: $(node -v)"
echo "Environment: $NODE_ENV"
echo "Current directory: $(pwd)"

if [ -f "server.js" ]; then
  echo "Found server.js - starting server..."
  node server.js
else
  echo "ERROR: server.js not found!"
  exit 1
fi