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

// Basic API endpoints for health checks and minimal functionality
// These are simplified versions of the full API routes

// User authentication endpoint
app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Cart endpoint
app.get('/api/cart', (req, res) => {
  res.json({ items: [] });
});

// Competitions endpoint - would connect to database in full implementation
app.get('/api/competitions', (req, res) => {
  // In production, this would fetch from the database
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

// Site config endpoints
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

// Stripe payment intent creation - simplified
app.post('/api/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe not configured" });
  }
  
  try {
    const { amount = 1000 } = req.body;
    
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "gbp",
      payment_method_types: ["card"]
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// Always serve index.html for client-side routing for non-API routes
app.get('*', (req, res) => {
  // Skip for API routes, which we've already handled
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  
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

# Create assets directory and add placeholder images
echo "Creating placeholder assets..."
mkdir -p public/assets

# Create a placeholder hero banner image
cat > public/assets/hero-banner.jpg << EOF
This is a placeholder for the hero banner image
EOF

# Create a placeholder Tesla image
cat > public/assets/tesla.jpg << EOF
This is a placeholder for the Tesla image
EOF

# Create a placeholder Hogwarts image
cat > public/assets/hogwarts.jpg << EOF
This is a placeholder for the Hogwarts image
EOF

# Create a placeholder logo
cat > public/assets/logo.png << EOF
MobyComps Logo Placeholder
EOF

echo "=== BUILD COMPLETED SUCCESSFULLY ==="
echo "Files in dist/public:"
find public -type f | sort

echo "=== FULL REACT APP DEPLOYMENT READY ==="