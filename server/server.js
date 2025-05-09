/**
 * Simple production server for Render deployment
 * This will work on any Node.js version without TypeScript requirements
 * Uses ESM syntax for modern Node compatibility
 */

// Set environment to production
process.env.NODE_ENV = 'production';

// Log environment information
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Environment variables:', Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')));

// Import required modules
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';
import { createServer } from 'http';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import multer from 'multer';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple express server for production
const app = express();
const port = process.env.PORT || 5000;

// Serve static files from the client build
app.use(express.static('../client/dist'));

// Handle API routes
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.send({ status: 'ok' });
});

// Fallback to client for all other routes
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: '../client/dist' });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
});