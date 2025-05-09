#!/bin/bash
# Start script for Render

set -e  # Exit on any error

# Use production build
cd dist
echo "============================================="
echo "Starting MobyComps application from $(pwd)"
echo "Node version: $(node -v)"
echo "Environment: $NODE_ENV"
echo "Database URL: ${DATABASE_URL:0:25}..." # Only show part of the URL for security
echo "PORT: $PORT"
echo "============================================="

# List files to verify everything is in place
echo "Checking build files:"
echo "- Server file: $(ls -la simple-server.js 2>/dev/null || echo 'MISSING!')"
echo "- Public directory: $(ls -la public 2>/dev/null | grep -c . || echo 'MISSING!')"
echo "- Assets: $(find public/assets -type f 2>/dev/null | wc -l || echo 'MISSING!')" 
echo "- index.html: $(ls -la public/index.html 2>/dev/null || echo 'MISSING!')"
echo "============================================="

# Make the simple server executable
chmod +x simple-server.js 2>/dev/null || true

# Set better logging for debugging
export DEBUG=express:*

# Start the server
echo "Starting server with simplified production mode..."
node simple-server.js