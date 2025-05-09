#!/bin/bash

# Exit on error
set -e

echo "🔄 Running build..."

# First run the regular build
npm run build

# Then copy the files to the needed location
echo "🔄 Copying build files to ensure server can find them..."
node scripts/copy-build-files.js

echo "✅ Build completed successfully"