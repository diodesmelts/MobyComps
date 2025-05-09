#!/bin/bash
set -e

echo "===== DIRECT RENDER DEPLOYMENT ====="

# Store original directory
ORIGINAL_DIR=$(pwd)

# Create a clean build directory
echo "Creating clean build directory..."
mkdir -p build-render
cd build-render

# Set up a minimal server and static files
echo "Setting up server files..."

# Create package.json
cat > package.json << 'EOL'
{
  "name": "mobycomps-platform",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2"
  }
}
EOL

# Create server.js
cat > server.js << 'EOL'
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 8080;
const app = express();

// Middleware
app.use(express.json());

// Health check endpoint (required by Render)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug info endpoint
app.get('/debug', (req, res) => {
  try {
    const publicDir = path.join(__dirname, 'public');
    const info = {
      env: process.env.NODE_ENV,
      nodeVersion: process.version,
      port: PORT,
      directory: __dirname,
      publicDir: publicDir,
      publicDirExists: fs.existsSync(publicDir),
      files: fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : []
    };
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API stubs to prevent frontend errors
app.get('/api/competitions', (req, res) => {
  res.json({ competitions: [], total: 0 });
});

app.get('/api/user', (req, res) => {
  res.status(401).json({ message: 'Not authenticated' });
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [] });
});

app.get('/api/site-config/hero-banner', (req, res) => {
  res.json({});
});

app.get('/api/admin/site-config/site-logo', (req, res) => {
  res.status(401).json({ error: 'Unauthorized' });
});

// Static files
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// SPA catch-all route
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback HTML if index.html doesn't exist
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MobyComps Prize Platform</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
            h1 { color: #1a73e8; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .btn { background: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 10px; }
            .status { padding: 4px 8px; border-radius: 4px; font-size: 14px; display: inline-block; }
            .online { background: #e6f4ea; color: #137333; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>MobyComps Prize Platform</h1>
          
          <div class="card">
            <h2>Deployment Status</h2>
            <p>Server status: <span class="status online">ONLINE</span></p>
            <p>The server is now running. This is a placeholder page that appears when the full application isn't available.</p>
            <a href="/debug" class="btn">View Debug Info</a>
          </div>
          
          <div class="card">
            <h2>Available Endpoints</h2>
            <ul>
              <li><a href="/health">Health Check</a></li>
              <li><a href="/debug">Debug Information</a></li>
              <li><a href="/api/competitions">API: Competitions</a></li>
            </ul>
          </div>
          
          <div class="card">
            <h2>Environment Details</h2>
            <pre id="env-info">Loading...</pre>
          </div>
          
          <script>
            // Fetch debug information
            fetch('/debug')
              .then(response => response.json())
              .then(data => {
                document.getElementById('env-info').textContent = JSON.stringify(data, null, 2);
              })
              .catch(error => {
                document.getElementById('env-info').textContent = 'Error loading debug information: ' + error.message;
              });
          </script>
        </body>
      </html>
    `);
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
EOL

# Create public directory and health check file
mkdir -p public/health
echo '{"status":"ok","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'> public/health/index.json

# Create a simple index.html
cat > public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MobyComps Prize Platform</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
    h1 { color: #1a73e8; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .btn { background: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 10px; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 14px; display: inline-block; }
    .online { background: #e6f4ea; color: #137333; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
  </style>
</head>
<body>
  <h1>MobyComps Prize Platform</h1>
  
  <div class="card">
    <h2>Deployment Status</h2>
    <p>Server status: <span class="status online">ONLINE</span></p>
    <p>The server is running successfully on Render!</p>
    <p>This static deployment establishes a foundation for further development.</p>
    <a href="/debug" class="btn">View Debug Info</a>
  </div>
  
  <div class="card">
    <h2>Next Steps</h2>
    <p>Now that the server is up and running, you can:</p>
    <ol>
      <li>Incrementally add API endpoints</li>
      <li>Set up database connections</li>
      <li>Gradually incorporate frontend components</li>
    </ol>
  </div>
  
  <div class="card">
    <h2>Environment Details</h2>
    <pre id="env-info">Loading...</pre>
  </div>
  
  <script>
    // Fetch debug information
    fetch('/debug')
      .then(response => response.json())
      .then(data => {
        document.getElementById('env-info').textContent = JSON.stringify(data, null, 2);
      })
      .catch(error => {
        document.getElementById('env-info').textContent = 'Error loading debug information: ' + error.message;
      });
  </script>
</body>
</html>
EOL

# Install Express
echo "Installing Express..."
npm install express

# Create a .env.sample file to document environment variables
cat > .env.sample << 'EOL'
# Server Configuration
PORT=8080
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgres://user:password@host:port/database

# Session Configuration
SESSION_SECRET=your_session_secret

# External Services
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
EOL

# Create a README.md for the deployment
cat > README.md << 'EOL'
# MobyComps Prize Platform - Render Deployment

This is a simplified deployment of the MobyComps Prize Platform, optimized for Render hosting.

## Environment Variables

The application requires the following environment variables:

- `PORT`: The port on which the server will run (default: 8080)
- `NODE_ENV`: The environment mode (e.g., 'production', 'development')
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `CLOUDINARY_*`: Cloudinary credentials for image uploads
- `STRIPE_*`: Stripe credentials for payment processing

## API Endpoints

- `/health`: Health check endpoint for Render monitoring
- `/debug`: Debug information about the current environment
- `/api/*`: API endpoints (currently stubs)

## Running Locally

```bash
npm install
npm start
```
EOL

# Show the final structure
echo "Final build directory structure:"
find . -type f | sort

# Copy everything back to the original directory
cd $ORIGINAL_DIR
echo "Copying build files to root directory..."
cp -r build-render/* .

echo "===== DEPLOYMENT READY ====="