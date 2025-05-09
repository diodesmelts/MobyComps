#!/bin/bash

# Exit on error
set -e

echo "🔄 Starting build process..."

# Install dependencies
echo "🔄 Installing dependencies..."
npm install

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