#!/usr/bin/env node

/*
 * This script handles building the project for production
 * It works around common issues with Render deployments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Log environment information
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Create a root package.json for Render if it doesn't exist
if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
  console.log('Creating root package.json for Render...');
  try {
    const packageRender = fs.readFileSync(path.join(process.cwd(), 'package-render.json'), 'utf8');
    fs.writeFileSync(path.join(process.cwd(), 'package.json'), packageRender);
    console.log('Successfully created package.json from package-render.json');
  } catch (err) {
    console.error('Failed to create package.json:', err);
  }
}

// Install Vite globally to ensure it's available
try {
  console.log('Installing Vite globally...');
  execSync('npm install -g vite', { stdio: 'inherit' });
} catch (error) {
  console.log('Failed to install Vite globally, continuing anyway');
}

// Install client dependencies and build
try {
  console.log('Installing client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });
  
  console.log('Building client...');
  execSync('cd client && npx vite build', { stdio: 'inherit' });
} catch (error) {
  console.error('Client build failed:', error.message);
  process.exit(1);
}

// Install server dependencies
try {
  console.log('Installing server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('Server dependencies installation failed:', error.message);
  process.exit(1);
}

console.log('Build completed successfully!');