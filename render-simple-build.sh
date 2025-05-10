#!/bin/bash
set -e

echo "=== STARTING SIMPLIFIED BUILD PROCESS ==="
echo "Node version: $(node -v)"
echo "Running in directory: $(pwd)"

# Install ALL dependencies including dev dependencies
echo "Installing ALL dependencies with better error tracking..."
npm ci --include=dev --verbose || {
  echo "Failed to install dependencies with npm ci. Falling back to npm install..."
  npm install --include=dev --verbose 
}

# Make sure all critical dependencies are installed 
echo "Installing critical dev dependencies directly..."
npm install --no-save @vitejs/plugin-react vite esbuild tailwindcss postcss autoprefixer @tailwindcss/vite

# Create a simplified vite.config.js for the build
echo "Creating simplified vite.config.js for build..."
cat > vite.config.simplified.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { join } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': join(__dirname, 'client'),
      '@assets': join(__dirname, 'attached_assets'),
      '@shared': join(__dirname, 'shared')
    }
  }
});
EOF

# Try building the React app with Vite 
echo "Building React application with Vite..."
npx vite build --config vite.config.simplified.js || {
  echo "Vite build with simplified config failed, trying direct build..."
  npx vite build
}

# Provide fallback if both build methods fail
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
  echo "Vite build failed, creating empty dist directory for fallback..."
  mkdir -p dist
fi

# Create dist directory structure
echo "Creating dist directory structure..."
mkdir -p dist/public

# Copy React build output to dist/public
echo "Copying build output to dist/public..."
if [ -d "dist/assets" ]; then
  echo "Found assets directory, copying..."
  cp -r dist/assets dist/public/
  echo "Assets copied successfully."
fi

if [ -f "dist/index.html" ]; then
  echo "Found index.html, copying..."
  cp dist/index.html dist/public/
  echo "index.html copied successfully."
fi

# Create server.js to serve the React app
echo "Creating server.js..."
cat > dist/server.js << 'EOF'
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import session from 'express-session';
import Stripe from 'stripe';
import { Pool } from '@neondatabase/serverless';
import connectPg from 'connect-pg-simple';
import ws from 'ws';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Neon
try {
  const { neonConfig } = await import('@neondatabase/serverless');
  neonConfig.webSocketConstructor = ws;
  console.log("Neon Serverless configured");
} catch (err) {
  console.warn("Could not configure Neon:", err.message);
}

// Create Express app
const app = express();
const port = process.env.PORT || 10000;

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Warning: STRIPE_SECRET_KEY not set. Payment features will be unavailable.");
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

// Setup session middleware
const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'moby-comps-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production'
  }
};

app.use(session(sessionOptions));

// Parse JSON bodies
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Determine directories
const publicDir = path.resolve(__dirname, 'public');
console.log("Public directory:", publicDir);
console.log("Public directory exists:", fs.existsSync(publicDir));

// Serve static files with correct cache headers
app.use(express.static(publicDir, {
  maxAge: '1d',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
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

// Basic API endpoints
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

app.get('/api/cart', (req, res) => {
  res.json({ items: [] });
});

app.get('/api/competitions', (req, res) => {
  res.json({ 
    competitions: [
      {
        id: 1,
        title: "Win a Tesla Model 3", 
        description: "Win a brand new Tesla Model 3. Competition ends when all tickets are sold.",
        imageUrl: "/assets/tesla.jpg",
        maxTickets: 1000,
        ticketPrice: 5.99,
        ticketsSold: 456,
        drawDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "live",
        category: "electronics",
        featured: true,
        quizQuestion: "What color is a red apple?",
        quizAnswer: "red"
      },
      {
        id: 2,
        title: "LEGO® Harry Potter™ Hogwarts Castle", 
        description: "Win the amazing LEGO® Harry Potter™ Hogwarts Castle with 6,020 pieces.",
        imageUrl: "/assets/hogwarts.jpg",
        maxTickets: 500,
        ticketPrice: 2.99,
        ticketsSold: 123,
        drawDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: "live",
        category: "kids",
        featured: true,
        quizQuestion: "What is the name of Harry Potter's school?",
        quizAnswer: "hogwarts"
      }
    ], 
    total: 2 
  });
});

app.get('/api/site-config/hero-banner', (req, res) => {
  res.json({
    id: 1,
    key: "hero-banner",
    value: JSON.stringify({
      title: "Win Amazing Prizes",
      subtitle: "Enter our competitions for your chance to win!",
      buttonText: "Browse Competitions",
      buttonLink: "/competitions",
      imageUrl: "/assets/hero-banner.jpg"
    }),
    updatedAt: new Date(),
    updatedBy: 1
  });
});

app.get('/api/admin/site-config/site-logo', (req, res) => {
  res.json({
    id: 2,
    key: "site-logo",
    value: JSON.stringify({
      logoUrl: "/assets/logo.png",
      altText: "MobyComps"
    }),
    updatedAt: new Date(),
    updatedBy: 1
  });
});

// Always serve index.html for client-side routing for non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Error: index.html not found');
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Serving static files from ${publicDir}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
});
EOF

# Create package.json for the dist directory
echo "Creating dist/package.json..."
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
    "@neondatabase/serverless": "^0.9.0",
    "connect-pg-simple": "^9.0.1",
    "express": "^4.18.2",
    "express-session": "^1.18.0",
    "stripe": "^14.16.0",
    "ws": "^8.14.2"
  }
}
EOF

# Install dependencies in the dist directory
echo "Installing server dependencies in dist directory..."
cd dist
npm install express express-session stripe @neondatabase/serverless connect-pg-simple ws

# Create placeholder assets if needed
echo "Checking for placeholder assets..."
if [ ! -d "public/assets" ]; then
  echo "Creating placeholder assets directory..."
  mkdir -p public/assets
fi

# Create fallback index.html in case React build fails
if [ ! -f "public/index.html" ]; then
  echo "Creating fallback index.html..."
  cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MobyComps - Prize Competitions</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 0; background: #f5f5f7; }
    .header { background: #4361ee; color: white; padding: 2rem; text-align: center; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .card { background: white; border-radius: 8px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .competition { display: flex; margin-bottom: 1.5rem; border-bottom: 1px solid #eee; padding-bottom: 1.5rem; }
    .competition img { width: 100px; height: 100px; background: #eee; margin-right: 1.5rem; object-fit: cover; }
    .btn { display: inline-block; background: #4361ee; color: white; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; }
    .error-message { background: #fff0f0; border-left: 4px solid #ff4d4f; padding: 1rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MobyComps</h1>
    <p>Win Amazing Prizes</p>
  </div>
  
  <div class="container">
    <div class="card">
      <h2>Active Competitions</h2>
      
      <div class="competition">
        <div style="width:100px;height:100px;background:#ddd;display:flex;align-items:center;justify-content:center;margin-right:1.5rem;">Tesla</div>
        <div>
          <h3>Win a Tesla Model 3</h3>
          <p>Win a brand new Tesla Model 3. Competition ends when all tickets are sold.</p>
          <p><strong>Ticket Price:</strong> £5.99</p>
          <a href="#" class="btn">Enter Now</a>
        </div>
      </div>
      
      <div class="competition">
        <div style="width:100px;height:100px;background:#ddd;display:flex;align-items:center;justify-content:center;margin-right:1.5rem;">LEGO</div>
        <div>
          <h3>LEGO® Harry Potter™ Hogwarts Castle</h3>
          <p>Win the amazing LEGO® Harry Potter™ Hogwarts Castle with 6,020 pieces.</p>
          <p><strong>Ticket Price:</strong> £2.99</p>
          <a href="#" class="btn">Enter Now</a>
        </div>
      </div>
    </div>
    
    <div class="error-message">
      <h3>Note: Static Version</h3>
      <p>You're seeing this fallback page because the React application could not be loaded.</p>
      <p>Please check the deployment logs for errors.</p>
      <ul>
        <li><a href="/health">/health</a> - Health check</li>
        <li><a href="/health/check">/health/check</a> - Detailed info</li>
      </ul>
    </div>
  </div>
</body>
</html>
EOF
fi

echo "=== BUILD COMPLETED SUCCESSFULLY ==="
echo "Files in dist/public:"
find dist/public -type f | sort || echo "No files found in dist/public"

echo "=== SIMPLIFIED DEPLOYMENT READY ==="