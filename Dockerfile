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

# Run our enhanced production build script instead of direct commands
COPY scripts/production-build.js ./scripts/

# Run the enhanced build script
RUN node scripts/production-build.js

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