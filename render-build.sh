#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
echo "Installing dependencies..."
npm install

# Ensure autoprefixer is available globally
echo "Installing autoprefixer globally..."
npm install -g autoprefixer postcss tailwindcss

# Build client assets
echo "Building client assets..."
npx vite build

# Build server
echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"