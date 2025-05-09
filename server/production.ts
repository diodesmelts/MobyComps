/**
 * Production-only server entrypoint with no Vite dependencies
 */
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

// Setup dirname for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create Express app
const app = express();

// Logger for production
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Serve static files for production
function serveStatic(app: express.Express) {
  // For debugging purposes
  log(`Current directory: ${process.cwd()}`, "debug");
  log(`Server directory: ${__dirname}`, "debug");
  
  // List all directories in the current folder to help with debugging
  try {
    const rootFiles = fs.readdirSync(process.cwd());
    log(`Files in root directory: ${rootFiles.join(', ')}`, "debug");
    
    if (fs.existsSync('dist')) {
      const distFiles = fs.readdirSync('dist');
      log(`Files in dist directory: ${distFiles.join(', ')}`, "debug");
      
      if (fs.existsSync('dist/public')) {
        const publicFiles = fs.readdirSync('dist/public');
        log(`Files in dist/public directory: ${publicFiles.join(', ')}`, "debug");
      }
    }
  } catch (err) {
    log(`Error listing directories: ${err}`, "error");
  }
  
  // These are all the possible locations where static files might be
  const staticPaths = [
    // Absolute paths for production environment
    path.resolve(process.cwd(), 'dist/public'),
    path.resolve(process.cwd(), 'public'),
    // Relative to server directory
    path.resolve(__dirname, 'public'),
    path.resolve(__dirname, '../dist/public'),
    path.resolve(__dirname, '../public')
  ];
  
  // Try each possible static path
  for (const staticPath of staticPaths) {
    if (fs.existsSync(staticPath)) {
      log(`Serving static files from ${staticPath}`, "express");
      app.use(express.static(staticPath, { index: 'index.html' }));
    } else {
      log(`Static path doesn't exist: ${staticPath}`, "debug");
    }
  }
  
  // Serve public files at root and other paths
  app.use(express.static(path.resolve(process.cwd(), 'dist/public')));
  
  // Fallback route - serves index.html for client-side routing
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    log(`Serving fallback for route: ${req.path}`, "debug");
    
    // Try to find index.html in any of the possible paths
    const possiblePaths = [
      path.resolve(process.cwd(), 'dist/public/index.html'),
      path.resolve(process.cwd(), 'public/index.html'),
      path.resolve(__dirname, 'public/index.html'),
      path.resolve(__dirname, '../dist/public/index.html'),
      path.resolve(__dirname, '../public/index.html')
    ];
    
    for (const indexPath of possiblePaths) {
      if (fs.existsSync(indexPath)) {
        log(`Found index.html at ${indexPath}`, "debug");
        return res.sendFile(indexPath);
      } else {
        log(`index.html not found at ${indexPath}`, "debug");
      }
    }
    
    // If index.html not found anywhere, return more detailed error
    res.status(404).send(`
      <html>
        <head><title>File Not Found</title></head>
        <body>
          <h1>index.html not found</h1>
          <p>Current directory: ${process.cwd()}</p>
          <p>Server directory: ${__dirname}</p>
          <p>Checked paths:</p>
          <ul>
            ${possiblePaths.map(p => `<li>${p} (${fs.existsSync(p) ? 'exists' : 'not found'})</li>`).join('')}
          </ul>
        </body>
      </html>
    `);
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug route to test HTML rendering
app.get('/debug-html', (req, res) => {
  // Create a simple HTML file for testing
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Debug HTML Page</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .container { border: 1px solid #ccc; padding: 20px; }
        </style>
      </head>
      <body>
        <h1>Debug HTML Page</h1>
        <div class="container">
          <p>This is a test page to verify HTML rendering works properly.</p>
          <p>Server time: ${new Date().toISOString()}</p>
          <p>Node version: ${process.version}</p>
          <p>Environment: ${process.env.NODE_ENV}</p>
        </div>
      </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Extended health check with debug information
app.get('/health/check', (req, res) => {
  // Also check the current working directory
  const currentDir = process.cwd();
  
  const staticPaths = [
    // Absolute paths for production environment
    path.resolve(currentDir, 'dist/public'),
    path.resolve(currentDir, 'public'),
    // Relative to server directory
    path.resolve(__dirname, 'public'),
    path.resolve(__dirname, '../dist/public'),
    path.resolve(__dirname, '../public')
  ];

  const staticPathsInfo = staticPaths.map(p => ({
    path: p,
    exists: fs.existsSync(p),
    files: fs.existsSync(p) ? fs.readdirSync(p).slice(0, 10) : [] // Show first 10 files
  }));
  
  // Check for index.html file specifically
  const indexPaths = [
    path.resolve(currentDir, 'dist/public/index.html'),
    path.resolve(currentDir, 'public/index.html'),
    path.resolve(__dirname, 'public/index.html'),
    path.resolve(__dirname, '../dist/public/index.html')
  ];
  
  const indexPathsInfo = indexPaths.map(p => ({
    path: p,
    exists: fs.existsSync(p),
    size: fs.existsSync(p) ? fs.statSync(p).size : 0
  }));

  // Get directory structure
  let directoryStructure = {};
  try {
    if (fs.existsSync(path.resolve(currentDir, 'dist'))) {
      directoryStructure['dist'] = fs.readdirSync(path.resolve(currentDir, 'dist'));
      
      if (fs.existsSync(path.resolve(currentDir, 'dist/public'))) {
        directoryStructure['dist/public'] = fs.readdirSync(path.resolve(currentDir, 'dist/public'));
      }
    }
  } catch (err) {
    directoryStructure['error'] = err.message;
  }

  const result = {
    status: 'ok',
    environment: process.env.NODE_ENV,
    server: {
      timestamp: new Date().toISOString(),
      directory: __dirname,
      currentDirectory: currentDir,
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
      node_version: process.version,
      platform: process.platform
    },
    staticFiles: staticPathsInfo,
    indexHtmlFiles: indexPathsInfo,
    directoryStructure,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    }
  };

  res.json(result);
});

// Serve static files
serveStatic(app);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  log(`Error: ${err.message}`, "error");
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Create HTTP server
const server = http.createServer(app);

// Main function to start the server
async function main() {
  try {
    // Register API routes
    await registerRoutes(app);
    
    // Start the server
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
      log(`serving on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the server
main();

export default server;