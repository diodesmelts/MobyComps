/**
 * Simple production server for Render deployment
 * This will work on any Node.js version without TypeScript requirements
 */

// Set environment to production
process.env.NODE_ENV = 'production';

// Log environment information
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Environment variables:', Object.keys(process.env).filter(key => !key.includes('SECRET') && !key.includes('KEY')));

// Try to run the TypeScript server first
try {
  console.log('Attempting to start server using tsx...');
  require('tsx').cli(['index.prod.ts']);
} catch (err) {
  console.log('Failed to start with tsx, falling back to node:', err.message);
  
  // If tsx fails, try running the compiled JS if it exists
  try {
    console.log('Checking for compiled JS server...');
    
    // Try different potential locations for the compiled server
    const fs = require('fs');
    if (fs.existsSync('./dist/index.js')) {
      require('./dist/index.js');
    } else if (fs.existsSync('../dist/server/index.js')) {
      require('../dist/server/index.js');
    } else {
      // Last resort: try to compile and run on the fly
      console.log('No compiled server found, attempting to compile on the fly...');
      require('child_process').execSync('npx tsx index.prod.ts', { stdio: 'inherit' });
    }
  } catch (err) {
    console.error('Failed to start server:', err);
    console.error('Please make sure you have run the build process correctly.');
    process.exit(1);
  }
}