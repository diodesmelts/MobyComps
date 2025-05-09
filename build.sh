#!/bin/bash

# Install all dependencies, including dev dependencies
npm install --include=dev

# Make sure we have these critical build tools
npm install -g esbuild typescript

# Build the client first
echo "Building client..."
npx vite build

# Make an explicit build directory
mkdir -p dist

# Build the server with explicit paths
echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/index.js

# Verify the build output exists
if [ -f "dist/index.js" ]; then
  echo "✅ Build successful - dist/index.js exists"
else
  echo "❌ Build failed - dist/index.js not found"
  exit 1
fi

echo "Build completed!"