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
  const staticPaths = [
    path.resolve(__dirname, 'public'),
    path.resolve(__dirname, '../dist/public'),
    path.resolve(__dirname, '../public')
  ];
  
  // Try each possible static path
  for (const staticPath of staticPaths) {
    if (fs.existsSync(staticPath)) {
      log(`Serving static files from ${staticPath}`, "express");
      app.use(express.static(staticPath, { index: 'index.html' }));
    }
  }
  
  // Fallback route - serves index.html for client-side routing
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Try to find index.html in any of the possible paths
    const possiblePaths = [
      path.resolve(__dirname, 'public/index.html'),
      path.resolve(__dirname, '../dist/public/index.html'),
      path.resolve(__dirname, '../public/index.html')
    ];
    
    for (const indexPath of possiblePaths) {
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
    
    // If index.html not found anywhere
    res.status(404).send('index.html not found');
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Extended health check with debug information
app.get('/health/check', (req, res) => {
  const staticPaths = [
    path.resolve(__dirname, 'public'),
    path.resolve(__dirname, '../dist/public'),
    path.resolve(__dirname, '../public')
  ];

  const staticPathsInfo = staticPaths.map(p => ({
    path: p,
    exists: fs.existsSync(p),
    files: fs.existsSync(p) ? fs.readdirSync(p).slice(0, 10) : [] // Show first 10 files
  }));

  const result = {
    status: 'ok',
    environment: process.env.NODE_ENV,
    server: {
      timestamp: new Date().toISOString(),
      directory: __dirname,
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
    },
    staticFiles: staticPathsInfo
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