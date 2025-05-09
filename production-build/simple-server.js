import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint
app.get('/debug-static', (req, res) => {
  const publicPath = path.join(__dirname, 'public');
  const files = fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : [];
  
  res.json({
    environment: process.env.NODE_ENV,
    publicPath,
    files,
    indexExists: fs.existsSync(path.join(publicPath, 'index.html')),
    assetsExist: fs.existsSync(path.join(publicPath, 'assets')),
  });
});

// Handle SPA routes - serve index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});