#!/bin/bash
# Build script specifically for Render deployment

# Set environment variables
export NODE_ENV=production

# Display Node.js and npm versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install production dependencies
echo "Installing dependencies..."
npm ci

# Build the client application (React frontend)
echo "Building client application..."
npx vite build

# Build the server
echo "Building server..."
npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js

# Copy shared directory to dist
echo "Copying shared directory..."
cp -r shared dist/

# Create uploads directory
echo "Creating uploads directory..."
mkdir -p dist/uploads

# Copy public files to dist/public
echo "Copying public files..."
if [ -d "public" ]; then
  cp -r public/* dist/public/ 2>/dev/null || true
fi

# Create package.json for the dist directory
echo "Creating production package.json..."
cat > dist/package.json << EOF
{
  "name": "mobycomps",
  "version": "1.0.0",
  "type": "module",
  "main": "production.js",
  "scripts": {
    "start": "node production.js"
  }
}
EOF

# Fix index.html asset references
echo "Post-processing index.html..."
if [ -f "dist/public/index.html" ]; then
  # Add error handler script
  sed -i 's/<head>/<head><script>window.__ASSET_ERROR_HANDLER__ = true; window.addEventListener("error", function(event) { if (event.target && (event.target.tagName === "SCRIPT" || event.target.tagName === "LINK")) { console.error("Asset loading error:", event.target.src || event.target.href); } }, true);<\/script>/' dist/public/index.html
  
  # Fix any development references
  sed -i 's|src="[^"]*/@fs/[^"]*"|src="/assets/index.js"|g' dist/public/index.html
  sed -i 's|href="[^"]*/@fs/[^"]*"|href="/assets/index.css"|g' dist/public/index.html
  sed -i 's|src="[^"]*/@vite/[^"]*"|src="/assets/index.js"|g' dist/public/index.html
  
  echo "index.html processed successfully"
fi

# Print build output structure
echo "Final build structure:"
find dist -type f | sort

echo "Build completed successfully!"