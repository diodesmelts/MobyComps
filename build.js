#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Print working directory
console.log('Current directory:', process.cwd());
console.log('Directory contents:', fs.readdirSync('.'));

// Check if postcss.config.js exists
if (fs.existsSync('postcss.config.js')) {
  console.log('postcss.config.js exists:', fs.readFileSync('postcss.config.js', 'utf8'));
}

// Install dependencies
console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Install autoprefixer and other required packages
console.log('Installing autoprefixer and other required packages...');
execSync('npm install autoprefixer postcss tailwindcss', { stdio: 'inherit' });

// Build the client
console.log('Building client...');
execSync('npx vite build', { stdio: 'inherit' });

// Build the server
console.log('Building server...');
execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });

console.log('Build completed successfully!');