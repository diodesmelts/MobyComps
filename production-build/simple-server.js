import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import pg from 'pg';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const port = process.env.PORT || 8080;

// Database connection for session storage
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const PgSession = pgSession(session);

// Setup session middleware
app.use(session({
  store: new PgSession({
    pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'moby-comps-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Parse JSON bodies
app.use(express.json());

// Determine the root directory
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'dist', 'public');

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Detailed health check endpoint
app.get('/health/check', (req, res) => {
  const systemInfo = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    node: process.version,
    env: process.env.NODE_ENV,
    dir: {
      current: process.cwd(),
      root: rootDir,
      public: publicDir
    },
    files: {
      publicExists: fs.existsSync(publicDir),
      indexExists: fs.existsSync(path.join(publicDir, 'index.html')),
      assetsExists: fs.existsSync(path.join(publicDir, 'assets'))
    }
  };
  
  // List assets if they exist
  if (systemInfo.files.assetsExists) {
    try {
      systemInfo.assets = fs.readdirSync(path.join(publicDir, 'assets'))
        .filter(file => file.endsWith('.js') || file.endsWith('.css'));
    } catch (err) {
      systemInfo.assets = `Error reading assets: ${err.message}`;
    }
  }
  
  res.json(systemInfo);
});

// Debug endpoint that sends a simple HTML page
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
            <li><a href="/debug-structure">View directory structure</a></li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Debug endpoint that shows directory structure
app.get('/debug-structure', (req, res) => {
  function listFiles(dir, prefix = '') {
    try {
      const items = fs.readdirSync(dir);
      let result = `<h3>${dir}</h3><ul>`;
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const isDirectory = fs.statSync(itemPath).isDirectory();
        
        result += `<li>${isDirectory ? '📁' : '📄'} ${item}</li>`;
        
        // Only go one level deep
        if (isDirectory && prefix === '') {
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
          <h2>Root Directory</h2>
          ${listFiles(rootDir)}
        </div>
        <div class="card">
          <p><a href="/">Back to main application</a></p>
        </div>
      </body>
    </html>
  `);
});

// Serve static files with correct MIME types and caching
app.use(express.static(publicDir, {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // Don't cache HTML files
      res.setHeader('Cache-Control', 'no-cache');
    } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
      // Cache assets for 1 day
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Read API routes for dynamic handling
import { db } from '../dist/shared/schema.js';
import express from 'express';
import { storage } from '../dist/server/storage.js';

// Set up API routes
app.get('/api/user', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error getting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/competitions', async (req, res) => {
  try {
    const result = await storage.listCompetitions({
      status: req.query.status,
      category: req.query.category,
      featured: req.query.featured === 'true',
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      search: req.query.search
    });
    res.json(result);
  } catch (err) {
    console.error('Error listing competitions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/cart', async (req, res) => {
  try {
    const sessionId = req.session.id;
    const items = await storage.getCartItems(sessionId);
    res.json({ items });
  } catch (err) {
    console.error('Error getting cart items:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/site-config/:key', async (req, res) => {
  try {
    const config = await storage.getSiteConfig(req.params.key);
    if (!config) {
      return res.status(404).json({ message: 'Config not found' });
    }
    res.json(config);
  } catch (err) {
    console.error('Error getting site config:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/site-config/:key', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const config = await storage.getSiteConfig(req.params.key);
    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }
    
    res.json(config);
  } catch (err) {
    console.error('Error getting admin site config:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// For any other API routes, return a 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Always serve index.html for any other request (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Serving static files from ${publicDir}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
});