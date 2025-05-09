#!/bin/bash
set -e

echo "Starting build process..."

# Navigate to client directory
cd client

# Clear previous build artifacts
rm -rf dist node_modules

# Install dependencies with clean cache
echo "Installing client dependencies..."
npm cache clean --force
npm ci

# Install Vite globally just in case
echo "Installing Vite globally..."
npm install -g vite

# Build the client with full path
echo "Building client application..."
npx vite build

# Navigate to server directory
cd ../server

# Clear previous server modules
rm -rf node_modules

# Install server dependencies
echo "Installing server dependencies..."
npm ci

echo "Build process completed successfully!"