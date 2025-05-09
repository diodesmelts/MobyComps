#!/bin/bash

# Exit on error
set -e

echo "🔄 Starting Render build process..."

# Explicitly install critical build dependencies first
echo "🔄 Installing critical build dependencies..."
npm install --no-save @vitejs/plugin-react vite esbuild @tailwindcss/vite tailwindcss postcss autoprefixer

# Install additional dev dependencies that might be needed
npm install --no-save typescript @types/react @types/react-dom @types/node

# Now install all dependencies, including dev dependencies
echo "🔄 Installing all dependencies..."
npm install --no-package-lock --include=dev

# Build the client and server
echo "🔄 Building the application..."
npm run build

# Copy built files to server/public directory
echo "🔄 Copying build files to server/public..."
mkdir -p server/public
cp -r dist/public/* server/public/ || echo "Warning: Could not copy build files"

# Create render-info.json manually
echo "🔄 Generating render environment info..."
RENDER_INFO="{
  \"environment\": \"${NODE_ENV:-production}\",
  \"baseURL\": \"${RENDER_EXTERNAL_URL:-''}\",
  \"buildTime\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
}"
echo "$RENDER_INFO" > server/public/render-info.json

# Run database migrations - only if we have a DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
  echo "🔄 Running database migrations..."
  npm run db:push
else
  echo "⚠️ DATABASE_URL not set, skipping database migrations"
fi

echo "✅ Build process completed successfully"