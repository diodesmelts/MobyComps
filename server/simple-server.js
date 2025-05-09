// Use .js for CommonJS since we'll run this with NODE_OPTIONS=--no-warnings
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Log environment info
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Files in directory:', fs.readdirSync('.'));

// Serve static files from the client/dist directory
app.use(express.static(path.join(__dirname, '../client/dist')));

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});