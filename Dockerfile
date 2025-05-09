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

# Install dependencies, including dev dependencies for build
RUN npm ci

# Copy source files
COPY . .

# Make sure the scripts directory is executable
RUN chmod +x scripts/*.js

# Build the application - first create a test environment file
RUN touch .env.test && \
    echo "DATABASE_URL=postgresql://test:test@localhost:5432/test" > .env.test && \
    echo "SESSION_SECRET=test_session_secret" >> .env.test

# Build the application 
RUN npm run build

# Production stage
FROM node:20-slim AS production

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
COPY --from=builder /app/dist/public ./dist/public

# Expose the port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Add healthcheck - retry quickly in development, more patience in production
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD curl --fail http://localhost:8080/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]