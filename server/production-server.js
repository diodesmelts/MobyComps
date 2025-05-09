// CommonJS-style Express server for production deployment
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const port = process.env.PORT || 5000;

// Log configuration
console.log('Starting production server...');
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV);

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API endpoints - simplified for production
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is working' });
});

// Specify the client/dist directory for static files
const clientDistPath = path.resolve(process.cwd(), 'client/dist');
console.log('Client dist path:', clientDistPath);

// Check if the path exists
if (fs.existsSync(clientDistPath)) {
  console.log('Client dist directory exists');
  // List files in the client/dist directory
  try {
    const files = fs.readdirSync(clientDistPath);
    console.log('Files in client/dist:', files);
  } catch (err) {
    console.error('Error reading client/dist directory:', err);
  }
} else {
  console.log('Client dist directory does not exist!');
}

// Serve static files from client/dist directory
app.use(express.static(clientDistPath));

// Fallback route handler for SPA
app.get('*', (req, res) => {
  // Exclude API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve index.html for client-side routing
  const indexPath = path.join(clientDistPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('index.html not found at', indexPath);
    // Provide a basic fallback page if index.html doesn't exist
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
        <h1>Moby Comps</h1>
        <p>The application is temporarily unavailable.</p>
        <p>Please try again later.</p>
      </body>
      </html>
    `);
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Server error');
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});