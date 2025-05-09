#!/bin/bash
set -e

echo "Updating client build script for Render compatibility..."

cd client

# Add Vite as a dependency (in case it's not there)
npm install -D vite@5.0.0

# Replace build script in package.json
sed -i 's/"build": ".*"/"build": "node .\\/node_modules\\/vite\\/bin\\/vite.js build"/' package.json

echo "Updated client/package.json build script:"
grep -A1 '"build":' package.json

echo "Verifying Vite installation..."
ls -la node_modules/vite || echo "Vite not found in node_modules!"

cd ..