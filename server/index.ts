import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { debugStaticFiles } from "./debug-static.js";
import { setupStaticHandler } from "./static-handler.js";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add debug route for static files
  debugStaticFiles(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Try all static handlers to ensure files are served
    setupStaticHandler(app);
    
    // Add direct route for index.html as a fallback
    app.get('/direct-index', (_req, res) => {
      const possiblePaths = [
        path.resolve(import.meta.dirname, 'public/index.html'),
        path.resolve(import.meta.dirname, '../dist/public/index.html'),
        path.resolve(import.meta.dirname, '../public/index.html'),
        path.resolve(import.meta.dirname, '../dist/index.html')
      ];
      
      // Try to find index.html in any of the possible paths
      for (const indexPath of possiblePaths) {
        if (fs.existsSync(indexPath)) {
          console.log(`Found index.html at ${indexPath}`);
          return res.sendFile(indexPath);
        }
      }
      
      // If not found, return detailed 404
      res.status(404).send(`
        <html>
          <head><title>Index not found</title></head>
          <body>
            <h1>Index.html not found</h1>
            <p>Checked paths:</p>
            <ul>${possiblePaths.map(p => `<li>${p} (${fs.existsSync(p) ? 'exists' : 'not found'})</li>`).join('')}</ul>
          </body>
        </html>
      `);
    });
    
    // Use the standard static file handler
    serveStatic(app);
  }

  // Use PORT from environment variables for production (Render deployment)
  // or fallback to port 5000 for development
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
