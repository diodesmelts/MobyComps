#!/bin/bash
set -e

echo "====== STATIC BUILD PROCESS ======"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install only production dependencies
echo "Installing production dependencies..."
npm ci --omit=dev

# Create a directory for our static build
echo "Creating static build directory..."
mkdir -p static-build/public

# Create a minimal static index.html
echo "Creating static index.html..."
cat > static-build/public/index.html << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MobyComps Prize Platform</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { color: #1a73e8; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .btn { background: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>MobyComps Prize Platform</h1>
  <div class="card">
    <h2>Welcome!</h2>
    <p>The application is successfully deployed but needs to be accessed from the main entry point.</p>
    <p>Please note: This is a static landing page. To access the full application, please use the main URL without any path.</p>
    <a href="/" class="btn">Go to Home Page</a>
  </div>
  <div class="card">
    <h2>Status</h2>
    <p>Server: <span id="server-status">Checking...</span></p>
    <p>API: <span id="api-status">Checking...</span></p>
  </div>

  <script>
    // Check server status
    fetch('/health')
      .then(response => response.json())
      .then(data => {
        document.getElementById('server-status').textContent = 'Online ✅';
        document.getElementById('server-status').style.color = 'green';
      })
      .catch(error => {
        document.getElementById('server-status').textContent = 'Offline ❌';
        document.getElementById('server-status').style.color = 'red';
      });

    // Check API status
    fetch('/api/competitions')
      .then(response => response.json())
      .then(data => {
        document.getElementById('api-status').textContent = 'Online ✅';
        document.getElementById('api-status').style.color = 'green';
      })
      .catch(error => {
        document.getElementById('api-status').textContent = 'Offline ❌';
        document.getElementById('api-status').style.color = 'red';
      });
  </script>
</body>
</html>
EOL

# Create a simple Node.js Express server
echo "Creating Express server..."
cat > static-build/server.js << EOL
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoints to return empty data
app.get('/api/competitions', (req, res) => {
  res.json({ competitions: [], total: 0 });
});

app.get('/api/user', (req, res) => {
  res.status(401).json({ message: 'Not authenticated' });
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [] });
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on port \${PORT}\`);
});
EOL

# Create a package.json file for the static build
echo "Creating package.json..."
cat > static-build/package.json << EOL
{
  "name": "mobycomps-static",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  }
}
EOL

# Add a health check file
echo "Creating health check file..."
mkdir -p static-build/public/health
echo '{"status":"ok","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'> static-build/public/health/index.json

# Copy built files to the root directory
echo "Copying static build to the root directory for Render..."
cp -r static-build/* .

echo "Static build complete! Files are ready for deployment."
echo "Contents of public directory:"
ls -la public

echo "====== STATIC BUILD COMPLETED SUCCESSFULLY ======"