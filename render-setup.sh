#!/bin/bash
set -e

echo "Render setup starting..."

# Enable debugging information
export NODE_ENV=production
export DEBUG=express:*

# Make all scripts executable
chmod +x *.sh

# Create directories if they don't exist
mkdir -p client/dist
mkdir -p server/dist

# Show environment information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory listing:"
ls -la

# Install global dependencies that might be needed
npm install -g vite tsx typescript

echo "Render setup completed successfully!"