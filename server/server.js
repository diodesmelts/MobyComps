/**
 * CommonJS Express server for development and fallback for production
 * This file exists as a compatibility layer for Docker deployment on Render
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const port = process.env.PORT || 5000;

// Log configuration
console.log('Starting server.js...');
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV);

// Body parsing middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Set up static file serving based on environment
let staticPath;

if (process.env.NODE_ENV === 'production') {
  // In production, serve from client/dist
  staticPath = path.resolve(process.cwd(), 'client/dist');
} else {
  // In development, this server isn't used for static files (Vite handles that)
  staticPath = path.resolve(process.cwd(), 'client/public');
}

console.log('Static file path:', staticPath);
if (fs.existsSync(staticPath)) {
  console.log('Static directory exists');
  app.use(express.static(staticPath));
}

// Fallback route handler for SPA
app.get('*', (req, res) => {
  // Exclude API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // In production, serve index.html for client-side routing
  if (process.env.NODE_ENV === 'production') {
    const indexPath = path.join(staticPath, 'index.html');
    console.log('Serving index.html from:', indexPath);
    
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }

  // Fallback message
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Moby Comps</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 50px; }
        h1 { color: #002147; }
      </style>
    </head>
    <body>
      <h1>Moby Comps Development Server</h1>
      <p>This is a development backend server. The frontend is served by Vite in development mode.</p>
      <p>In production, the full app will be served from this endpoint.</p>
    </body>
    </html>
  `);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Server error');
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Note: In development, frontend is handled by Vite on a different port');
  }
});