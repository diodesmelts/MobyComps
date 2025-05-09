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
const clientDistPath = path.resolve(__dirname, "../client/dist");

// For debugging
console.log("Current directory:", __dirname);
console.log("Looking for client build at:", clientDistPath);
console.log("Directory exists:", fs.existsSync(clientDistPath));

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
    log("Serving static files from " + clientDistPath);
    app.use(express.static(clientDistPath));
    
    // Handle client-side routing - serve index.html for all non-API routes
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
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
  const port = process.env.PORT || 5000;
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});