#!/bin/bash
set -e

# Print Node.js version for debugging
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Stage 1: Install dependencies only
echo "Installing dependencies..."
npm ci
# Required: make sure dev dependencies are installed
export NODE_ENV=development 

# Stage 2: Build frontend in a way that doesn't rely on Vite plugins dynamically
echo "Building frontend..."

# Create a simplified vite.config.js that doesn't use dynamic imports
cat > simple-vite.config.js << EOL
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
EOL

# Build with the simplified config
echo "Running Vite build with simplified config..."
npx vite build --config simple-vite.config.js

# Stage 3: Build backend
echo "Building backend..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Stage 4: Verify the build
echo "Verifying build..."
if [ -d "dist/public" ] && [ -f "dist/public/index.html" ]; then
  echo "✅ Frontend build successful"
else
  echo "❌ Frontend build failed"
  exit 1
fi

if [ -f "dist/index.js" ]; then
  echo "✅ Backend build successful"
else
  echo "❌ Backend build failed"
  exit 1
fi

# Create a health check file
mkdir -p dist/public/health
echo '{"status":"ok","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'> dist/public/health/index.json

# Show build output for debugging
echo "Build contents:"
find dist -type f | sort

echo "Build completed successfully!"