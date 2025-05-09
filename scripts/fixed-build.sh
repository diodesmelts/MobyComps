#!/bin/bash

# Exit on error
set -e

echo "🔄 Running build..."

# First run the regular build
npm run build

# Then copy the files to the needed location
echo "🔄 Copying build files to ensure server can find them..."
chmod +x scripts/copy-build-files.sh
./scripts/copy-build-files.sh

# Create render-info.json manually since we can't rely on the JS version
echo "🔄 Generating render environment info..."
mkdir -p server/public
RENDER_INFO="{
  \"environment\": \"${NODE_ENV:-production}\",
  \"baseURL\": \"${RENDER_EXTERNAL_URL:-''}\",
  \"buildTime\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
}"
echo "$RENDER_INFO" > server/public/render-info.json
echo "✅ Generated render info"

echo "✅ Build completed successfully"