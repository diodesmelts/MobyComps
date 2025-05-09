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

# Use direct commands instead of the production build script to avoid module system issues
RUN echo "Building client and server directly..."

# Build the client with Vite
RUN npx vite build

# Build the server
RUN npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js

# Copy necessary files
RUN cp -r shared dist/ && \
    mkdir -p dist/uploads && \
    echo '{"name":"mobycomps","version":"1.0.0","type":"module","main":"production.js"}' > dist/package.json

# Copy static files to public directory
RUN if [ -d "public" ]; then \
      mkdir -p dist/public && \
      cp -r public/* dist/public/ 2>/dev/null || true; \
    fi

# Add error handling to index.html
RUN if [ -f "dist/public/index.html" ]; then \
      # Create a backup
      cp dist/public/index.html dist/public/index.html.bak && \
      # Add error handling for assets
      echo "Adding error handler to index.html" && \
      sed -i 's/<head>/<head><script>window.__ASSET_ERROR_HANDLER__ = true; window.addEventListener("error", function(event) { if (event.target && (event.target.tagName === "SCRIPT" || event.target.tagName === "LINK")) { console.error("Asset loading error:", event.target.src || event.target.href); } }, true);<\/script>/' dist/public/index.html && \
      # Fix any development references
      sed -i 's|src="[^"]*/@fs/[^"]*"|src="/assets/index.js"|g' dist/public/index.html && \
      sed -i 's|href="[^"]*/@fs/[^"]*"|href="/assets/index.css"|g' dist/public/index.html && \
      echo "Processed index.html successfully"; \
    else \
      echo "index.html not found, creating a fallback version" && \
      mkdir -p dist/public && \
      echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>MobyComps Prize Competitions</title><script>window.location.href = "/fallback.html";</script></head><body><noscript><meta http-equiv="refresh" content="0;url=/fallback.html"><p>Redirecting to <a href="/fallback.html">fallback version</a></p></noscript></body></html>' > dist/public/index.html; \
    fi

# Add detailed debugging of the final output
RUN echo "Final build output structure:" && find dist -type f | sort

# Make sure the index.html file is available with proper paths
RUN echo "Checking index.html file:" && cat dist/public/index.html | grep -o 'src="[^"]*"' || echo "No script tags found in index.html"

# Verify the contents of any JavaScript files to debug paths
RUN echo "Checking for asset imports in JavaScript files:" && \
    find dist/public -name "*.js" -exec grep -l "import" {} \; | head -n 3 || echo "No import statements found"

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

# Copy our static public files
COPY --from=builder /app/public ./public

# Create additional directories
RUN mkdir -p ./uploads

# Copy needed static and configuration files
COPY --from=builder /app/.env.example ./.env.example

# Make sure the static files copied correctly
RUN echo "Files in public directory:" && ls -la ./public && \
    echo "Files in dist/public directory:" && ls -la ./dist/public 2>/dev/null || echo "dist/public not found"

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