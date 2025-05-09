#!/bin/bash

# Exit on error
set -e

echo "🔄 Starting Render build process..."

# First check if some key dev dependencies are installed
echo "🔄 Checking for required dev dependencies..."
if ! npm list @vitejs/plugin-react > /dev/null 2>&1; then
  echo "🔄 Installing @vitejs/plugin-react..."
  npm install --no-save @vitejs/plugin-react
fi

# Explicitly install all dependencies, including dev dependencies
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