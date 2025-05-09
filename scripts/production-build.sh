#!/bin/bash
set -e

echo "=== Starting Production Build ==="
echo "Current working directory: $(pwd)"

# Install regular dependencies (not dev dependencies)
echo "Installing production dependencies..."
npm ci --omit=dev

# Install only the specific build dependencies we need
echo "Installing build dependencies..."
npm install --no-save vite @vitejs/plugin-react esbuild

# Create output directories
echo "Creating output directories..."
mkdir -p production-build/public

# Build frontend locally
echo "Building frontend..."
cd client
../node_modules/.bin/vite build --outDir ../production-build/public
cd ..

echo "Frontend build complete, files in production-build/public:"
ls -la production-build/public

# Copy server file to production build
echo "Copying server file..."
cp production-build/simple-server.js production-build/index.js

# Create package.json for production
echo "Creating production package.json..."
cat > production-build/package.json << EOL
{
  "name": "prize-competition-platform",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  }
}
EOL

# Create health check file
echo "Creating health check file..."
mkdir -p production-build/public/health
echo '{"status":"ok","time":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'> production-build/public/health/index.json

echo "=== Production Build Complete ==="
echo "Files in production-build directory:"
find production-build -type f | sort

echo "To deploy, copy the contents of the production-build directory to your hosting environment."