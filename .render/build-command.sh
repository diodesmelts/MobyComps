#!/bin/bash

# Log the directory structure
echo "Current directory structure:"
ls -la

# Install dependencies (global ones too)
echo "Installing dependencies..."
npm install
npm install -g autoprefixer postcss tailwindcss

# Ensure we have the right versions of dependencies
npm install autoprefixer postcss tailwindcss

# View the PostCSS config
echo "PostCSS config:"
cat postcss.config.js

# Build the client with verbose logging
echo "Building client..."
npx vite build --debug

# Build the server
echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"