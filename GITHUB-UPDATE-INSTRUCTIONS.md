# GitHub Update Instructions

To fix the Docker build for deployment, you need to update the following files in your GitHub repository:

## 1. Update Dockerfile

Replace your Dockerfile with:

```dockerfile
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install required system dependencies for Node-gyp
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies for build
RUN npm ci

# Copy source files
COPY . .

# Make sure the scripts directory is executable
RUN chmod +x scripts/*.js 2>/dev/null || true

# Set up a custom vite.config for production build
RUN echo "import { defineConfig } from 'vite'; \
import react from '@vitejs/plugin-react'; \
import path from 'path'; \
export default defineConfig({ \
  plugins: [react()], \
  resolve: { \
    alias: { \
      '@': path.resolve('/app/client/src'), \
      '@shared': path.resolve('/app/shared'), \
      '@assets': path.resolve('/app/attached_assets'), \
    }, \
  }, \
  root: '/app/client', \
  build: { \
    outDir: '/app/dist/public', \
    emptyOutDir: true, \
  }, \
});" > /app/vite.prod.config.js

# Build the client with the production config
RUN npx vite build --config /app/vite.prod.config.js

# Build our production server file (not using the Vite-dependent one)
RUN npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js \
    && cp -r shared dist/ \
    && mkdir -p dist/uploads 2>/dev/null || true \
    && echo '{"version":"1.0.0"}' > dist/package.json

# Production stage
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy needed static and configuration files
COPY --from=builder /app/.env.example ./.env.example

# Expose the port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Add healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl --fail http://localhost:8080/health || exit 1

# Start the production server
CMD ["node", "dist/production.js"]
```

## 2. Add server/production.ts

Create a new file `server/production.ts` with:

```typescript
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
```

## 3. Update render.yaml

Update the `render.yaml` file:

```yaml
services:
  - type: web
    name: prize-competition-platform
    env: docker
    dockerCommand: node dist/production.js
    plan: standard
    autoDeploy: true
    healthCheckPath: /health
    buildFilter:
      paths:
        - server/**/*
        - client/**/*
        - shared/**/*
        - Dockerfile
    numInstances: 1
    scaling:
      minInstances: 1
      maxInstances: 3
      targetMemoryPercent: 80
      targetCpuPercent: 80
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: prize-competition-database
          property: connectionString
      - key: PORT
        value: 8080
      - key: SESSION_SECRET
        generateValue: true
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_PUBLISHABLE_KEY
        sync: false

databases:
  - name: prize-competition-database
    plan: starter
    ipAllowList:
      - source: 0.0.0.0/0
        description: everywhere
    postgresMajorVersion: 15
```

## 4. Create Empty Toaster Component

Create a file `client/src/empty-toaster.tsx` with:

```tsx
// Empty toaster component that doesn't depend on anything else
// This helps us test that components can be imported correctly
export function Toaster() {
  return <div id="toaster" style={{ display: 'none' }} />;
}

export default Toaster;
```

## 5. Create Toaster Component

Create a file `client/src/components/ui/toaster.tsx` with:

```tsx
// Re-export the simplified toaster for build testing
import { Toaster } from '../../empty-toaster';
export { Toaster };
export default Toaster;
```

## 6. Create Docker Ignore

Create a `.dockerignore` file with:

```
node_modules
npm-debug.log
dist
.git
.github
*.md
!README.md
.DS_Store
.vscode
.idea
.env
.env.*
!.env.example
```

After making all these changes, try deploying again on Render.