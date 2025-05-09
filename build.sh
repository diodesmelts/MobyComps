#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the client
echo "Building client..."
npx vite build

# Build the server
echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"