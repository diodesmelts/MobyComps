FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy client files and build
COPY client ./client/
WORKDIR /app/client
RUN npm install
RUN npm run build

# Copy server files
WORKDIR /app
COPY server ./server/
COPY shared ./shared/
COPY drizzle.config.ts ./

# Production environment
FROM node:20-alpine

WORKDIR /app

# Copy built client and server files
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/drizzle.config.ts ./

# Install production dependencies only
RUN npm install --only=production

# Expose port
EXPOSE 5000

# Set environment variable
ENV NODE_ENV=production

# Start the application
CMD ["node", "server/server.js"]