// Production server entry point (CommonJS compatible)
// This file will be used by Render to start the server

// Set environment to production
process.env.NODE_ENV = 'production';

// Simple wrapper to load and run the server code
try {
  console.log('Starting server in production mode...');
  
  // First try to load from dist/index.js (compiled output)
  try {
    require('./dist/index.js');
    console.log('Server started from dist/index.js');
  } catch (err) {
    console.log('Could not load from dist/index.js, trying dist/server/index.js');
    
    // Then try to load from dist/server/index.js
    try {
      require('./dist/server/index.js');
      console.log('Server started from dist/server/index.js');
    } catch (err) {
      console.log('Could not load server from expected locations, falling back to tsx');
      
      // Final fallback: use tsx to run the original TypeScript directly
      console.log('Running with tsx fallback from server/index.ts');
      require('tsx/dist/cli');
      require('./server/index.ts');
    }
  }
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}