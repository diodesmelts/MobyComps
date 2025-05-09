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

# Build the client separately first
RUN cd client && npx vite build

# Build our production server file (not using the Vite-dependent one)
RUN npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js

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