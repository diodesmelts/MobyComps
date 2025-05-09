import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";
import { serveStatic } from "./vite";
import { log } from "./vite";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Production-specific settings
const isProd = process.env.NODE_ENV === "production";

// Try to locate the client build directory
let clientDistPath = "";
const possiblePaths = [
  path.resolve(__dirname, "../client/dist"),
  path.resolve(__dirname, "../../client/dist"),
  path.resolve(process.cwd(), "client/dist"),
  path.resolve(process.cwd(), "../client/dist")
];

// Find the first path that exists
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    clientDistPath = testPath;
    break;
  }
}

// For debugging
console.log("Current directory:", __dirname);
console.log("Process working directory:", process.cwd());
console.log("Possible client build paths:", possiblePaths);
console.log("Selected client build path:", clientDistPath);
console.log("Client build directory exists:", clientDistPath ? fs.existsSync(clientDistPath) : false);

async function main() {
  const app = express();

  // Configure middleware
  app.use(express.json());
  
  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "development-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProd,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      },
    })
  );
  
  // Set up authentication
  setupAuth(app);
  
  // Register API routes
  const httpServer = await registerRoutes(app);
  
  // Serve static files from the client build directory in production
  if (isProd) {
    if (clientDistPath && fs.existsSync(clientDistPath)) {
      log("Serving static files from " + clientDistPath);
      app.use(express.static(clientDistPath));
      
      // Handle client-side routing - serve index.html for all non-API routes
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next();
        }
        
        const indexPath = path.join(clientDistPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          // If index.html doesn't exist, return a helpful error
          res.status(500).send(`
            <h1>Server Configuration Error</h1>
            <p>The client build files could not be located.</p>
            <p>Current search path: ${clientDistPath}</p>
            <p>Please make sure the build process has completed successfully.</p>
          `);
        }
      });
    } else {
      // Client build directory not found, add a fallback route
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next();
        }
        
        res.status(500).send(`
          <h1>Server Configuration Error</h1>
          <p>The client build directory was not found.</p>
          <p>Searched paths: ${JSON.stringify(possiblePaths)}</p>
          <p>Please make sure the build process has completed successfully.</p>
        `);
      });
    }
  } else {
    // In development, use Vite's dev server
    serveStatic(app);
  }
  
  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      message: err.message || "Internal Server Error",
    });
  });
  
  // Start server
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});