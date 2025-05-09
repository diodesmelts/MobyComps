#!/bin/bash
set -e

echo "==== RENDER DEPLOYMENT SCRIPT ===="
echo "Current directory: $(pwd)"

# Create simple server script 
echo "Creating server script..."
cat > server.js << 'EOL'
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 8080;
const app = express();

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static files
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Debug endpoint
app.get('/debug', (req, res) => {
  const info = {
    env: process.env.NODE_ENV,
    port: PORT,
    cwd: process.cwd(),
    files: fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : [],
    publicDirExists: fs.existsSync(publicDir)
  };
  res.json(info);
});

// API stub
app.get('/api/*', (req, res) => {
  res.json({ message: 'API endpoint not implemented in this static deployment' });
});

// Catch-all handler to serve index.html
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MobyComps Prize Platform</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
            h1 { color: #1a73e8; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            pre { background: #f5f5f5; padding: 10px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>MobyComps Prize Platform</h1>
          <div class="card">
            <h2>Deployment Success</h2>
            <p>The server is running but no static files were found.</p>
            <p>Please check the <a href="/debug">debug information</a> for more details.</p>
          </div>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
EOL

# Create minimal HTML 
echo "Creating minimal HTML page..."
mkdir -p public
cat > public/index.html << 'EOL'
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
    .status { display: inline-block; padding: 4px 8px; border-radius: 4px; }
    .online { background: #e6f4ea; color: #137333; }
    .offline { background: #fce8e6; color: #c5221f; }
    pre { background: #f5f5f5; padding: 10px; overflow: auto; }
  </style>
</head>
<body>
  <h1>MobyComps Prize Platform</h1>
  
  <div class="card">
    <h2>Deployment Status</h2>
    <p>Server status: <span class="status online">ONLINE</span></p>
    <p>This is a placeholder page for the MobyComps Prize Platform.</p>
    <p>The application server is successfully deployed but is currently serving a static version.</p>
  </div>
  
  <div class="card">
    <h2>Links</h2>
    <ul>
      <li><a href="/health">Health Check</a></li>
      <li><a href="/debug">Debug Information</a></li>
    </ul>
  </div>
  
  <div class="card">
    <h2>Environment</h2>
    <pre id="env-info">Loading...</pre>
  </div>
  
  <script>
    // Fetch debug info
    fetch('/debug')
      .then(response => response.json())
      .then(data => {
        document.getElementById('env-info').textContent = JSON.stringify(data, null, 2);
      })
      .catch(error => {
        document.getElementById('env-info').textContent = 'Error loading debug information';
      });
  </script>
</body>
</html>
EOL

# Create health check JSON
mkdir -p public/health
echo '{"status":"ok","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'> public/health/index.json

# Create package.json
echo "Creating package.json..."
cat > package.json << 'EOL'
{
  "name": "mobycomps-platform",
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

# Install dependencies
echo "Installing Express..."
npm install express

echo "==== DEPLOYMENT PREPARATION COMPLETE ===="
echo "Files ready for Render deployment:"
ls -la

echo "Directory structure:"
find . -maxdepth 2 -type f | sort