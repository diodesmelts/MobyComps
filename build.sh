#!/bin/bash
set -e

echo "Starting build process..."

# Build client
echo "Building client application..."
cd client
npm ci
npm run build
cd ..

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm ci
cd ..

echo "Build completed successfully!"