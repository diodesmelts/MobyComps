#!/bin/bash

# Install dependencies
npm install

# Install PostCSS and autoprefixer
npm install autoprefixer postcss tailwindcss

# Build the client
echo "Building client..."
npx vite build

# Build the server with ESBuild
echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed!"