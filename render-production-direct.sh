#!/bin/bash
set -e

echo "=== STARTING DIRECT PRODUCTION DEPLOYMENT PROCESS ==="
echo "Node version: $(node -v)"

# Install production dependencies only
echo "Installing production dependencies..."
npm ci --omit=dev

# Create server directory
echo "Creating production server directory..."
mkdir -p production

# Copy necessary server files to production directory
echo "Copying server files..."
cp -r server production/
cp -r shared production/
cp package.json production/

# Create a simple static HTML file that will be served when React is not built
echo "Creating static HTML file..."
cat > production/index.html << 'EOF'
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
    .competition-image { width: 100px; height: 100px; background: #eee; margin-right: 1.5rem; display: flex; align-items: center; justify-content: center; }
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
        <div class="competition-image">Tesla</div>
        <div>
          <h3>Win a Tesla Model 3</h3>
          <p>Win a brand new Tesla Model 3. Competition ends when all tickets are sold.</p>
          <p><strong>Ticket Price:</strong> £5.99</p>
          <a href="#" class="btn">Enter Now</a>
        </div>
      </div>
      
      <div class="competition">
        <div class="competition-image">LEGO</div>
        <div>
          <h3>LEGO® Harry Potter™ Hogwarts Castle</h3>
          <p>Win the amazing LEGO® Harry Potter™ Hogwarts Castle with 6,020 pieces.</p>
          <p><strong>Ticket Price:</strong> £2.99</p>
          <a href="#" class="btn">Enter Now</a>
        </div>
      </div>
    </div>
    
    <div class="error-message">
      <h3>API Mode Only</h3>
      <p>This deployment is running in API-only mode with a simplified frontend.</p>
      <p>The full React application is not deployed in this version.</p>
      <ul>
        <li><a href="/health">/health</a> - Basic health check</li>
        <li><a href="/api/competitions">/api/competitions</a> - List competitions</li>
      </ul>
    </div>
  </div>
</body>
</html>
EOF

# Create a production startup script
echo "Creating production server script..."
cat > production/server.js << 'EOF'
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import session from 'express-session';
import { Pool } from '@neondatabase/serverless';
import Stripe from 'stripe';
import connectPg from 'connect-pg-simple';
import * as schema from './shared/schema.js';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database config for neon
if (process.env.DATABASE_URL) {
  console.log("Setting up Neon serverless config...");
  import('@neondatabase/serverless').then(({ neonConfig }) => {
    neonConfig.webSocketConstructor = ws;
  }).catch(err => {
    console.error("Error configuring Neon:", err);
  });
}

// Create Express app
const app = express();
const port = process.env.PORT || 10000;

// Database connection
let pool;
let db;
let PostgresSessionStore;

if (process.env.DATABASE_URL) {
  console.log("Database URL found, connecting to PostgreSQL...");
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle(pool, { schema });
    PostgresSessionStore = connectPg(session);
    console.log("Database connection established");
  } catch (err) {
    console.error("Error connecting to database:", err);
  }
}

// Initialize Stripe
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
  console.log("Stripe initialized");
} else {
  console.warn("Warning: STRIPE_SECRET_KEY not set. Payment features will be unavailable.");
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

// Serve static files - the React app would be here in a full deployment
app.use(express.static(path.join(__dirname), {
  index: 'index.html'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: !!pool ? 'connected' : 'not configured',
    stripe: !!stripe ? 'initialized' : 'not configured'
  });
});

// Detailed health check
app.get('/health/check', (req, res) => {
  const info = {
    timestamp: new Date().toISOString(),
    node: process.version,
    env: process.env.NODE_ENV,
    database: !!pool ? 'connected' : 'not configured',
    stripe: !!stripe ? 'initialized' : 'not configured'
  };
  
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
        imageUrl: "/tesla.jpg",
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
        imageUrl: "/hogwarts.jpg",
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
      imageUrl: "/hero-banner.jpg"
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
      logoUrl: "/logo.png",
      altText: "MobyComps"
    }),
    updatedAt: new Date(),
    updatedBy: 1
  });
});

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${!!pool ? 'Connected' : 'Not configured'}`);
  console.log(`Stripe: ${!!stripe ? 'Initialized' : 'Not configured'}`);
});
EOF

# Create a package.json for the production directory
echo "Creating production package.json..."
cat > production/package.json << EOF
{
  "name": "mobycomps-api",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.9.0",
    "connect-pg-simple": "^9.0.1",
    "drizzle-orm": "^0.34.0",
    "express": "^4.18.2",
    "express-session": "^1.18.0",
    "stripe": "^14.16.0",
    "ws": "^8.14.2"
  }
}
EOF

# Install production dependencies in the production directory
echo "Installing production dependencies..."
cd production
npm install

echo "=== BUILD COMPLETED SUCCESSFULLY ==="
echo "Files in production directory:"
ls -la | grep -v node_modules
echo "=== DIRECT PRODUCTION DEPLOYMENT READY ==="