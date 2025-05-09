#!/bin/bash
# Build script specifically for Render deployment

set -e  # Exit on any error

# Set environment variables
export NODE_ENV=production

# Display Node.js and npm versions
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install all dependencies (including dev dependencies for build)
echo "Installing dependencies..."
npm ci

# Build the client application (React frontend)
echo "Building client application with production template..."
if [ -f "client/index.production.html" ]; then
  # Use production template if it exists
  cp client/index.production.html client/index.html.template
  npx vite build --template index.html.template
  rm client/index.html.template
else
  npx vite build
fi

# Build the simplified production server
echo "Building simplified server for production..."
mkdir -p dist/server
mkdir -p dist/production-build

# Copy the simplified server
cp production-build/simple-server.js dist/simple-server.js

# Copy shared directory to dist
echo "Copying shared directory..."
cp -r shared dist/

# Create uploads directory
echo "Creating uploads directory..."
mkdir -p dist/uploads

# Copy public files to dist/public
echo "Copying public files..."
if [ -d "public" ]; then
  mkdir -p dist/public
  cp -r public/* dist/public/ 2>/dev/null || true
fi

# Create package.json for the dist directory
echo "Creating production package.json..."
cat > dist/package.json << EOF
{
  "name": "mobycomps",
  "version": "1.0.0",
  "type": "module",
  "main": "simple-server.js",
  "scripts": {
    "start": "node simple-server.js"
  }
}
EOF

# Process the index.html file to ensure it works in production
echo "Post-processing index.html..."
if [ -f "dist/public/index.html" ]; then
  # Create a backup
  cp dist/public/index.html dist/public/index.html.bak
  
  # Add error handler script if not already present
  if ! grep -q "__ASSET_ERROR_HANDLER__" dist/public/index.html; then
    sed -i 's/<head>/<head><script>window.__ASSET_ERROR_HANDLER__ = true; window.addEventListener("error", function(event) { if (event.target && (event.target.tagName === "SCRIPT" || event.target.tagName === "LINK")) { console.error("Asset loading error:", event.target.src || event.target.href); } }, true);<\/script>/' dist/public/index.html
  fi
  
  # Fix any development references
  sed -i 's|src="[^"]*/@fs/[^"]*"|src="/assets/index.js"|g' dist/public/index.html
  sed -i 's|href="[^"]*/@fs/[^"]*"|href="/assets/index.css"|g' dist/public/index.html
  sed -i 's|src="[^"]*/@vite/[^"]*"|src="/assets/index.js"|g' dist/public/index.html
  
  # Add preloads for main assets if not already present
  if ! grep -q "rel=\"preload\"" dist/public/index.html; then
    echo "Adding preload hints..."
    
    # Find the first JavaScript file in assets
    MAIN_JS=$(find dist/public/assets -name "*.js" | head -n 1)
    if [ -n "$MAIN_JS" ]; then
      JS_FILENAME=$(basename "$MAIN_JS")
      sed -i "s|<head>|<head><link rel=\"preload\" href=\"/assets/$JS_FILENAME\" as=\"script\">|" dist/public/index.html
    fi
    
    # Find the first CSS file in assets
    MAIN_CSS=$(find dist/public/assets -name "*.css" | head -n 1)
    if [ -n "$MAIN_CSS" ]; then
      CSS_FILENAME=$(basename "$MAIN_CSS")
      sed -i "s|<head>|<head><link rel=\"preload\" href=\"/assets/$CSS_FILENAME\" as=\"style\">|" dist/public/index.html
    fi
  fi
  
  echo "index.html processed successfully"
else
  echo "WARNING: index.html not found, creating fallback..."
  mkdir -p dist/public
  cat > dist/public/index.html << EOF
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>MobyComps Prize Competitions</title>
    <script>
      // Look for assets in the right place
      const script = document.createElement('script');
      script.src = '/assets/index.js';
      script.type = 'module';
      document.head.appendChild(script);
      
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = '/assets/index.css';
      document.head.appendChild(css);
    </script>
  </head>
  <body>
    <div id="root"></div>
    <noscript>
      <div style="padding: 2rem; text-align: center;">
        <h1>JavaScript Required</h1>
        <p>MobyComps requires JavaScript to work properly.</p>
        <a href="/fallback.html">View Static Version</a>
      </div>
    </noscript>
  </body>
</html>
EOF
fi

# Print build output structure
echo "Final build structure:"
find dist -type f | sort

# Verify critical files exist
echo "Verifying build output..."
if [ -f "dist/simple-server.js" ]; then
  echo "✅ Production server exists"
else
  echo "❌ Production server is missing!"
  exit 1
fi

if [ -f "dist/public/index.html" ]; then
  echo "✅ index.html exists"
else
  echo "❌ index.html is missing!"
  exit 1
fi

if [ -d "dist/public/assets" ]; then
  echo "✅ Assets directory exists"
  JS_COUNT=$(find dist/public/assets -name "*.js" | wc -l)
  CSS_COUNT=$(find dist/public/assets -name "*.css" | wc -l)
  echo "  - JavaScript files: $JS_COUNT"
  echo "  - CSS files: $CSS_COUNT"
  
  if [ "$JS_COUNT" -eq 0 ]; then
    echo "❌ No JavaScript files found in assets!"
  fi
else
  echo "❌ Assets directory is missing!"
  exit 1
fi

echo "Build completed successfully! 🎉"