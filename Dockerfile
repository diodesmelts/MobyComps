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

# Add a debug script to verify what files were built
RUN echo "Client build output:" && ls -la dist/public

# Create a minimal index.html if it doesn't exist for some reason
RUN if [ ! -f dist/public/index.html ]; then \
    echo "WARNING: index.html not found, creating minimal version" && \
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Prize Competitions</title></head><body><div id="root"></div><script type="module" src="/assets/index.js"></script></body></html>' > dist/public/index.html; \
    fi

# Build our production server file (not using the Vite-dependent one)
RUN npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js \
    && cp -r shared dist/ \
    && mkdir -p dist/uploads 2>/dev/null || true \
    && echo '{"version":"1.0.0"}' > dist/package.json
    
# Debug file structure
RUN echo "Final build output structure:" && find dist -type f | sort

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
COPY --from=builder /app/dist/public ./public

# Create additional directories
RUN mkdir -p ./uploads

# Copy needed static and configuration files
COPY --from=builder /app/.env.example ./.env.example

# Create a static index.html in multiple locations for redundancy
RUN echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Prize Competitions</title></head><body><div id="root"></div><script type="module" src="/assets/index.js"></script></body></html>' > ./public/index.html && \
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Prize Competitions</title></head><body><div id="root"></div><script type="module" src="/assets/index.js"></script></body></html>' > ./dist/public/index.html

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