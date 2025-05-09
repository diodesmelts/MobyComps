#!/bin/bash
set -e

echo "Starting custom build process for Render..."

# Client build
echo "Building client application..."
cd client

# Install dependencies
echo "Installing client dependencies..."
npm install

# Install vite globally
echo "Installing Vite globally..."
npm install -g vite

# Run build with explicitly installed vite
echo "Building client with Vite..."
npx --yes vite build

# Output directory contents for debugging
echo "Client build completed. Checking output directory..."
ls -la dist

# Server install
echo "Installing server dependencies..."
cd ../server
npm install

echo "Build process completed successfully!"