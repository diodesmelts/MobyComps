import { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Register health check routes for monitoring
 */
export function registerHealthRoutes(app: Express) {
  // Simple health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Extended health check with debug information
  app.get('/health/check', (req, res) => {
    const staticPaths = [
      path.resolve(__dirname, '../public'),
      path.resolve(__dirname, '../../dist/public'),
      path.resolve(__dirname, '../../public')
    ];

    const staticPathsInfo = staticPaths.map(p => ({
      path: p,
      exists: fs.existsSync(p),
      files: fs.existsSync(p) ? fs.readdirSync(p) : []
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
}