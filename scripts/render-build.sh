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

# Run database migrations - only if we have a DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
  echo "🔄 Running database migrations..."
  npm run db:push
else
  echo "⚠️ DATABASE_URL not set, skipping database migrations"
fi

echo "✅ Build process completed successfully"