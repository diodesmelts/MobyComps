// This script generates a JSON file with environment-specific information
// that will be accessible to the client-side code
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Get potential public directories
const publicDirs = [
  path.join(rootDir, 'server', 'public'),
  path.join(rootDir, 'dist', 'public'),
  path.join(rootDir, 'public')
];

// Find a valid public directory
let validPublicDir = null;
for (const dir of publicDirs) {
  if (fs.existsSync(dir)) {
    validPublicDir = dir;
    break;
  }
}

if (!validPublicDir) {
  console.error('No valid public directory found');
  process.exit(1);
}

// Create an info file with Render-specific settings
const info = {
  environment: process.env.NODE_ENV || 'development',
  baseURL: process.env.RENDER_EXTERNAL_URL || '',
  buildTime: new Date().toISOString(),
  publicPath: validPublicDir
};

// Write to the public directory
const infoFile = path.join(validPublicDir, 'render-info.json');
fs.writeFileSync(infoFile, JSON.stringify(info, null, 2));

console.log(`Generated render info at: ${infoFile}`);
console.log(`Using public directory: ${validPublicDir}`);