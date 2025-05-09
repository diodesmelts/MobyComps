#!/bin/bash

# Install all dependencies
echo "Installing dependencies..."
npm install
npm install autoprefixer postcss tailwindcss

# Create the server build
echo "Building server..."
mkdir -p dist
npx tsc -m commonjs --outDir ./dist ./server/index.ts

# Skip client build for now to get server running
echo "Build completed!"