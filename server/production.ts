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

// Serve static files first - this is important for correct order
serveStatic(app);

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

// Root route that serves a complete application as a fallback
// This will only be hit if the static index.html wasn't found or served
app.get('/', (req, res) => {
  // Find the assets directory
  let assetsDir = '';
  try {
    if (fs.existsSync(path.resolve(process.cwd(), 'dist/public/assets'))) {
      const assets = fs.readdirSync(path.resolve(process.cwd(), 'dist/public/assets'));
      if (assets.length > 0) {
        // Find JS files
        const jsFiles = assets.filter(file => file.endsWith('.js'));
        assetsDir = 'dist/public/assets';
        log(`Found assets in ${assetsDir}: ${jsFiles.join(', ')}`, "debug");
      }
    }
  } catch (err) {
    log(`Error reading assets: ${err}`, "error");
  }

  // Create a standalone application HTML
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>MobyComps Prize Competitions</title>
        <style>
          body, html { 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0;
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
            background-color: #f5f5f7;
          }
          header {
            background-color: #1a1a1a;
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .content {
            flex: 1;
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
          }
          .card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            padding: 2rem;
            margin-bottom: 2rem;
          }
          h1 { margin: 0; font-size: 1.5rem; }
          h2 { margin-top: 0; color: #333; }
          p { line-height: 1.6; color: #555; }
          .btn {
            display: inline-block;
            background-color: #ff5500;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 1rem;
          }
          .footer {
            background-color: #1a1a1a;
            color: white;
            text-align: center;
            padding: 1.5rem;
            margin-top: 2rem;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>MobyComps Prize Competitions</h1>
        </header>
        
        <div class="content">
          <div class="card">
            <h2>Welcome to MobyComps</h2>
            <p>Your destination for exciting prize competitions. Win amazing prizes with just a few clicks!</p>
            <p>Status: Server is running correctly!</p>
            <p>This is a static fallback page. The main application will be available soon.</p>
            <a href="/health/check" class="btn">View Server Status</a>
          </div>
          
          <div class="card">
            <h2>Server Information</h2>
            <p>Server Time: ${new Date().toISOString()}</p>
            <p>Node Version: ${process.version}</p>
            <p>Environment: ${process.env.NODE_ENV}</p>
            <p>Assets Directory: ${assetsDir || 'Not found'}</p>
          </div>
        </div>
        
        <div class="footer">
          &copy; 2025 MobyComps - All rights reserved
        </div>
      </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// A route that just shows the project structure
app.get('/debug-structure', (req, res) => {
  // List all directories and files recursively
  function listFilesRecursively(dir, prefix = '') {
    let result = [];
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          result.push(`${prefix}📁 ${file}/`);
          result = result.concat(listFilesRecursively(filePath, `${prefix}  `));
        } else {
          result.push(`${prefix}📄 ${file} (${(stat.size / 1024).toFixed(2)} KB)`);
        }
      }
    } catch (err) {
      result.push(`${prefix}❌ Error: ${err.message}`);
    }
    return result;
  }

  const rootDir = process.cwd();
  const fileTree = listFilesRecursively(rootDir);
  
  // Create a simple HTML output
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Project Structure</title>
        <style>
          body { font-family: monospace; background: #f5f5f5; padding: 20px; }
          h1 { color: #333; }
          pre { 
            background: #fff;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow-x: auto;
          }
        </style>
      </head>
      <body>
        <h1>Project Directory Structure</h1>
        <pre>${fileTree.join('\n')}</pre>
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