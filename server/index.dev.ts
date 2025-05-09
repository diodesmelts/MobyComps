import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./logger";
import path from "path";
import fs from "fs";

const app = express();

// CORS configuration
app.use((req, res, next) => {
  // In development, we need to allow the Vite dev server to access our API
  // The Vite server typically runs on port 3000 or 5173
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  
  // Log the CORS origin for debugging
  console.log(`Using CORS origin: ${corsOrigin}`);
  
  res.header('Access-Control-Allow-Origin', corsOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static files from client/dist directory
  const clientDistPath = path.join(__dirname, '../client/dist');
  
  // Check if the client/dist directory exists
  if (fs.existsSync(clientDistPath)) {
    log(`Serving static files from ${clientDistPath}`);
    app.use(express.static(clientDistPath));
    
    // Fallback to index.html for SPA routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  } else {
    log(`Client build directory not found at ${clientDistPath}`);
  }

  // Use environment port or fallback to 5000
  const port = process.env.PORT || 5000;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();