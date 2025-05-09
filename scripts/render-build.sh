#!/bin/bash
set -e

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the application
echo "Building the application..."
npm run build

# Create the server directory structure
echo "Creating server directory structure..."
mkdir -p dist/public

# Copy static files to the right location
echo "Copying static files..."
cp -R client/dist/* dist/public/

# Create a health check file
echo "Creating health check file..."
mkdir -p dist/public/health
echo '{"status":"ok"}' > dist/public/health/index.json

# Display directory structure for debugging
echo "Directory structure:"
find dist -type f | sort

echo "Build completed successfully!"