#!/bin/bash
set -e

# Display current working directory for debugging
echo "Current working directory: $(pwd)"

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the application
echo "Building the application..."
npm run build

# Create the server directory structure
echo "Creating server directory structure..."
mkdir -p dist/public

# Ensure client/dist exists
if [ ! -d "client/dist" ]; then
  echo "ERROR: client/dist directory doesn't exist after build!"
  echo "Contents of client directory:"
  ls -la client/
  exit 1
fi

# Verbose copy of static files to the right location
echo "Copying static files..."
echo "Source directory contents (client/dist):"
ls -la client/dist/

# Copy everything, including hidden files
cp -Rv client/dist/* dist/public/

# Make an extra copy of the index.html at the root level for safety
cp client/dist/index.html dist/index.html

# Double-check that the copied files exist
echo "Destination directory contents (dist/public):"
ls -la dist/public/

# Create a health check file
echo "Creating health check file..."
mkdir -p dist/public/health
echo '{"status":"ok","time":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'> dist/public/health/index.json

# Display full directory structure for debugging
echo "Full directory structure:"
find dist -type f -o -type l | sort

# Verify the index.html file exists and has content
if [ -f "dist/public/index.html" ]; then
  echo "✅ index.html found with size: $(wc -c < dist/public/index.html) bytes"
  echo "First 100 characters of index.html:"
  head -c 100 dist/public/index.html
else
  echo "❌ ERROR: index.html not found in dist/public!"
fi

# Verify asset directory exists
if [ -d "dist/public/assets" ]; then
  echo "✅ assets directory found with $(find dist/public/assets -type f | wc -l) files"
else 
  echo "❌ WARNING: assets directory not found in dist/public!"
fi

echo "Build completed successfully!"