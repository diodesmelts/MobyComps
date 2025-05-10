#!/bin/bash
# Script to deploy the FULL React app to Render
set -e  # Exit on any error

echo "=== STARTING FULL REACT DEPLOYMENT BUILD ==="
echo "Node version: $(node -v)"
echo "Current directory: $(pwd)"

# Install ALL dependencies including dev dependencies
echo "Installing ALL dependencies..."
npm ci --include=dev

# Build the client application with Vite
echo "Building React application with Vite..."
npx vite build

# Create a server file that properly serves the React app
echo "Creating optimized server for React app..."
cat > dist/server.js << 'EOF'
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import session from 'express-session';
import Stripe from 'stripe';
import { Pool } from '@neondatabase/serverless';
import connectPg from 'connect-pg-simple';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const port = process.env.PORT || 8080;

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Warning: STRIPE_SECRET_KEY not set. Payment features will be unavailable.");
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

// Database connection
let pool;
let PostgresSessionStore;

if (process.env.DATABASE_URL) {
  console.log("Database URL found, connecting to PostgreSQL...");
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    PostgresSessionStore = connectPg(session);
    console.log("Database connection established");
  } catch (err) {
    console.error("Error connecting to database:", err);
  }
} else {
  console.warn("Warning: DATABASE_URL not set. Database features will be unavailable.");
}

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

// Use PostgreSQL session store if available
if (pool && PostgresSessionStore) {
  sessionOptions.store = new PostgresSessionStore({
    pool,
    createTableIfMissing: true,
  });
  console.log("Using PostgreSQL session store");
}

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

// Debug endpoint for structure
app.get('/debug-structure', (req, res) => {
  function listFiles(dir, prefix = '') {
    try {
      const items = fs.readdirSync(dir);
      let result = `<h3>${dir}</h3><ul>`;
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const isDirectory = fs.statSync(itemPath).isDirectory();
        
        result += `<li>${isDirectory ? '📁' : '📄'} ${item}</li>`;
        
        if (isDirectory && prefix === '' && item === 'assets') {
          try {
            const subItems = fs.readdirSync(itemPath);
            result += '<ul>';
            for (const subItem of subItems) {
              const subItemPath = path.join(itemPath, subItem);
              const isSubDir = fs.statSync(subItemPath).isDirectory();
              result += `<li>${isSubDir ? '📁' : '📄'} ${subItem}</li>`;
            }
            result += '</ul>';
          } catch (err) {
            result += `<ul><li>Error reading subdir: ${err.message}</li></ul>`;
          }
        }
      }
      
      result += '</ul>';
      return result;
    } catch (err) {
      return `<p>Error listing files in ${dir}: ${err.message}</p>`;
    }
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>MobyComps Directory Structure</title>
        <style>
          body { font-family: sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
          h1 { color: #4361ee; }
          .card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }
          ul { list-style-type: none; padding-left: 20px; }
          li { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>MobyComps Directory Structure</h1>
        <div class="card">
          <h2>Current Working Directory</h2>
          ${listFiles(process.cwd())}
        </div>
        <div class="card">
          <h2>Public Directory</h2>
          ${listFiles(publicDir)}
        </div>
        <div class="card">
          <p><a href="/">Back to main application</a></p>
        </div>
      </body>
    </html>
  `);
});

// Always serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Serving static files from ${publicDir}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
});
EOF

# Create a package.json for the dist directory
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
    "express": "^4.18.2",
    "express-session": "^1.18.0",
    "stripe": "^14.16.0",
    "@neondatabase/serverless": "^0.9.0",
    "connect-pg-simple": "^9.0.1"
  }
}
EOF

# Install dependencies in the dist directory
echo "Installing server dependencies in dist directory..."
cd dist
npm install express express-session stripe @neondatabase/serverless connect-pg-simple

echo "=== BUILD COMPLETED SUCCESSFULLY ==="
echo "Files in dist/public:"
find public -type f | sort

echo "=== FULL REACT APP DEPLOYMENT READY ==="