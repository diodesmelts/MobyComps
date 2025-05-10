#!/bin/bash
# Direct deployment script for Render that bypasses all the complex build steps

set -e  # Exit on any error

echo "=== STARTING DIRECT DEPLOYMENT BUILD ==="
echo "Node version: $(node -v)"
echo "Current directory: $(pwd)"

# Install dependencies 
echo "Installing dependencies..."
npm ci

# Create dist directory structure
mkdir -p dist/public/assets
mkdir -p dist/shared
mkdir -p dist/uploads

# Build the client application
echo "Building client..."
npx vite build

# Copy the simplified server directly (most important part)
echo "Setting up simplified server..."
mkdir -p production-build 2>/dev/null || true

# Create simplified server if it doesn't exist yet
if [ ! -f "production-build/simple-server.js" ]; then
  echo "Creating simplified server..."
  cat > production-build/simple-server.js << 'EOF'
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const port = process.env.PORT || 8080;

// Parse JSON bodies
app.use(express.json());

// Determine directories
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'dist', 'public');

// Serve static files
app.use(express.static(publicDir, {
  maxAge: '1d',
  etag: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Debug info
app.get('/health/check', (req, res) => {
  const info = {
    timestamp: new Date().toISOString(),
    node: process.version,
    env: process.env.NODE_ENV,
    dir: {
      current: process.cwd(),
      public: publicDir,
    },
    files: {
      publicExists: fs.existsSync(publicDir),
      indexExists: fs.existsSync(path.join(publicDir, 'index.html')),
      assetsExists: fs.existsSync(path.join(publicDir, 'assets'))
    }
  };
  
  if (info.files.assetsExists) {
    try {
      info.assets = fs.readdirSync(path.join(publicDir, 'assets'))
        .filter(file => file.endsWith('.js') || file.endsWith('.css'));
    } catch (err) {
      info.assets = `Error: ${err.message}`;
    }
  }
  
  res.json(info);
});

// Always serve index.html for any other request (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Serving files from ${publicDir}`);
});
EOF
fi

# Copy the server
cp production-build/simple-server.js dist/server.js

# Create a package.json for the dist directory
echo "Creating package.json..."
cat > dist/package.json << EOF
{
  "name": "mobycomps",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}
EOF

# Create a super simple index.html that directly loads assets if needed
if [ ! -f "dist/public/index.html" ] || grep -q "window.location.href = '/fallback.html'" "dist/public/index.html"; then
  echo "Creating direct index.html..."
  cat > dist/public/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MobyComps - Prize Competitions</title>
  <script type="module" src="/assets/index.js"></script>
  <link rel="stylesheet" href="/assets/index.css">
</head>
<body>
  <div id="root"></div>
</body>
</html>
EOF
fi

echo "=== BUILD COMPLETED ==="
echo "Files in dist:"
find dist -type f | sort

echo "=== DEPLOYMENT READY ==="