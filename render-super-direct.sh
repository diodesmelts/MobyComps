#!/bin/bash
# Super simplified build script that skips Vite altogether
set -e  # Exit on any error

echo "=== STARTING SUPER DIRECT DEPLOYMENT BUILD ==="
echo "Node version: $(node -v)"
echo "Current directory: $(pwd)"

# Install only production dependencies
echo "Installing production dependencies..."
npm ci --omit=dev

# Create dist directories
mkdir -p dist/public/assets
mkdir -p dist/shared
mkdir -p dist/uploads

# Create the super minimal server.js
echo "Creating simplified server..."
cat > dist/server.js << 'EOF'
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

// CORS middleware for API requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Determine the root directory
const rootDir = process.cwd();
const publicDir = path.resolve(rootDir, 'public');
const distPublicDir = path.resolve(rootDir, 'dist/public');

// Serve static files from multiple directories with fallbacks
app.use(express.static(distPublicDir, {
  maxAge: '1d',
  etag: true
}));

app.use(express.static(publicDir, {
  maxAge: '1d',
  etag: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Health check with details
app.get('/health/check', (req, res) => {
  const info = {
    timestamp: new Date().toISOString(),
    node: process.version,
    env: process.env.NODE_ENV,
    dir: {
      current: process.cwd(),
      public: publicDir,
      distPublic: distPublicDir
    },
    files: {
      publicExists: fs.existsSync(publicDir),
      distPublicExists: fs.existsSync(distPublicDir)
    }
  };
  
  // List public files
  if (fs.existsSync(publicDir)) {
    try {
      info.publicFiles = fs.readdirSync(publicDir);
    } catch (err) {
      info.publicFiles = `Error: ${err.message}`;
    }
  }
  
  // List dist/public files
  if (fs.existsSync(distPublicDir)) {
    try {
      info.distPublicFiles = fs.readdirSync(distPublicDir);
    } catch (err) {
      info.distPublicFiles = `Error: ${err.message}`;
    }
  }
  
  res.json(info);
});

// Debug endpoints
app.get('/debug-html', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>MobyComps Debug Page</title>
        <style>
          body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #4361ee; }
          .card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>MobyComps Debug Page</h1>
        <div class="card">
          <h2>Server is running!</h2>
          <p>This simple page is served directly from the Express server.</p>
          <p>Current time: ${new Date().toLocaleString()}</p>
        </div>
        <div class="card">
          <h2>Next Steps</h2>
          <ul>
            <li><a href="/">Go to the main application</a></li>
            <li><a href="/health/check">View server health check info</a></li>
            <li><a href="/fallback.html">View fallback page</a></li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Copy the static fallback HTML file to public directory
const fallbackHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MobyComps - Prize Competitions</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    nav a {
      margin-left: 20px;
      color: #4361ee;
      text-decoration: none;
      font-weight: 500;
    }
    .hero {
      background-color: #4361ee;
      color: white;
      padding: 60px 20px;
      text-align: center;
      margin: 20px 0;
      border-radius: 8px;
    }
    .hero h1 {
      font-size: 2.5rem;
      margin-bottom: 15px;
    }
    .hero p {
      font-size: 1.2rem;
      margin-bottom: 25px;
    }
    .button {
      background-color: white;
      color: #4361ee;
      padding: 10px 20px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
    }
    h2 {
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
      margin-top: 40px;
    }
    .competitions {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .competition {
      border: 1px solid #eee;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.2s;
    }
    .competition:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .competition-content {
      padding: 15px;
    }
    .competition-image {
      height: 200px;
      background-color: #f0f4ff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4361ee;
      font-size: 1.5rem;
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">
      <h2>MobyComps</h2>
    </div>
    <nav>
      <a href="#">Competitions</a>
      <a href="#">Winners</a>
      <a href="#">How It Works</a>
      <a href="#">Login</a>
    </nav>
  </header>
  
  <section class="hero">
    <h1>Win Amazing Prizes</h1>
    <p>Join our prize competitions for a chance to win your dream items!</p>
    <a href="#" class="button">Browse Competitions</a>
  </section>
  
  <h2>Featured Competitions</h2>
  
  <div class="competitions">
    <div class="competition">
      <div class="competition-image">Tesla Model 3</div>
      <div class="competition-content">
        <h3>Tesla Model 3</h3>
        <p>Win a brand new Tesla Model 3 Performance!</p>
      </div>
    </div>
    
    <div class="competition">
      <div class="competition-image">LEGO Harry Potter</div>
      <div class="competition-content">
        <h3>LEGO Harry Potter</h3>
        <p>Complete LEGO Harry Potter Castle Collection!</p>
      </div>
    </div>
    
    <div class="competition">
      <div class="competition-image">Holiday Package</div>
      <div class="competition-content">
        <h3>Holiday Package</h3>
        <p>Win a luxury holiday package for two!</p>
      </div>
    </div>
  </div>
  
  <footer style="margin-top: 40px; padding: 20px 0; border-top: 1px solid #eee; text-align: center;">
    <p>© 2025 MobyComps - All Rights Reserved</p>
  </footer>
</body>
</html>
`;

try {
  if (!fs.existsSync(distPublicDir)) {
    fs.mkdirSync(distPublicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(distPublicDir, 'fallback.html'), fallbackHtml);
  console.log('Created fallback.html');
} catch (err) {
  console.error('Error creating fallback.html:', err);
}

// Always serve fallback.html for any request (except API and health endpoints)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  // Try to serve index.html from dist/public
  const distIndexPath = path.join(distPublicDir, 'index.html');
  if (fs.existsSync(distIndexPath)) {
    return res.sendFile(distIndexPath);
  }
  
  // Try to serve index.html from public
  const publicIndexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(publicIndexPath)) {
    return res.sendFile(publicIndexPath);
  }
  
  // Fall back to fallback.html
  const fallbackPath = path.join(distPublicDir, 'fallback.html');
  if (fs.existsSync(fallbackPath)) {
    return res.sendFile(fallbackPath);
  }
  
  // If nothing else works, send a simple message
  res.send('<h1>MobyComps Prize Competitions</h1><p>Please check back soon.</p>');
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Serving static files from ${publicDir} and ${distPublicDir}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
});
EOF

# Create package.json for the dist directory
echo "Creating package.json..."
cat > dist/package.json << EOF
{
  "name": "mobycomps",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF

# Copy public directory to dist/public
if [ -d "public" ]; then
  echo "Copying public files to dist/public..."
  cp -r public/* dist/public/ 2>/dev/null || true
fi

# Create a simple index.html in case it doesn't exist
if [ ! -f "dist/public/index.html" ]; then
  echo "Creating index.html..."
  cat > dist/public/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MobyComps - Prize Competitions</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    nav a {
      margin-left: 20px;
      color: #4361ee;
      text-decoration: none;
      font-weight: 500;
    }
    .hero {
      background-color: #4361ee;
      color: white;
      padding: 60px 20px;
      text-align: center;
      margin: 20px 0;
      border-radius: 8px;
    }
    .hero h1 {
      font-size: 2.5rem;
      margin-bottom: 15px;
    }
    .hero p {
      font-size: 1.2rem;
      margin-bottom: 25px;
    }
    .button {
      background-color: white;
      color: #4361ee;
      padding: 10px 20px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
    }
    h2 {
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
      margin-top: 40px;
    }
    .competitions {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .competition {
      border: 1px solid #eee;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.2s;
    }
    .competition:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .competition-content {
      padding: 15px;
    }
    .competition-image {
      height: 200px;
      background-color: #f0f4ff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4361ee;
      font-size: 1.5rem;
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">
      <h2>MobyComps</h2>
    </div>
    <nav>
      <a href="#">Competitions</a>
      <a href="#">Winners</a>
      <a href="#">How It Works</a>
      <a href="#">Login</a>
    </nav>
  </header>
  
  <section class="hero">
    <h1>Win Amazing Prizes</h1>
    <p>Join our prize competitions for a chance to win your dream items!</p>
    <a href="#" class="button">Browse Competitions</a>
  </section>
  
  <h2>Featured Competitions</h2>
  
  <div class="competitions">
    <div class="competition">
      <div class="competition-image">Tesla Model 3</div>
      <div class="competition-content">
        <h3>Tesla Model 3</h3>
        <p>Win a brand new Tesla Model 3 Performance!</p>
      </div>
    </div>
    
    <div class="competition">
      <div class="competition-image">LEGO Harry Potter</div>
      <div class="competition-content">
        <h3>LEGO Harry Potter</h3>
        <p>Complete LEGO Harry Potter Castle Collection!</p>
      </div>
    </div>
    
    <div class="competition">
      <div class="competition-image">Holiday Package</div>
      <div class="competition-content">
        <h3>Holiday Package</h3>
        <p>Win a luxury holiday package for two!</p>
      </div>
    </div>
  </div>
  
  <footer style="margin-top: 40px; padding: 20px 0; border-top: 1px solid #eee; text-align: center;">
    <p>© 2025 MobyComps - All Rights Reserved</p>
  </footer>
</body>
</html>
EOF
fi

# Install express in the dist directory
echo "Installing express in dist directory..."
cd dist
npm install express

echo "=== BUILD COMPLETED ==="
echo "Files in dist:"
find . -type f | sort

echo "=== DEPLOYMENT READY ==="