import { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Register health check routes for monitoring
 */
export function registerHealthRoutes(app: Express) {
  // Basic health check endpoint
  app.get("/health", (req, res) => {
    // Check possible locations for public files
    const possiblePaths = [
      path.resolve("server/public"),
      path.resolve("dist/public"),
      path.resolve("public")
    ];
    
    let foundPublicDir = false;
    let indexFound = false;
    
    for (const dir of possiblePaths) {
      if (fs.existsSync(dir)) {
        foundPublicDir = true;
        // Check for index.html
        if (fs.existsSync(path.join(dir, "index.html"))) {
          indexFound = true;
          break;
        }
      }
    }
    
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      staticFiles: {
        publicDirFound: foundPublicDir,
        indexHtmlFound: indexFound
      }
    });
  });
}