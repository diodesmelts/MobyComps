FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy all files
COPY . .

# Patch Vite config for compatibility
WORKDIR /app/client
RUN node patch-vite-config.cjs

# Install client dependencies and build
RUN npm install
# Set a longer build timeout for Tailwind CSS processing
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Copy tailwind.config.js to ensure Tailwind can find classes
RUN cp tailwind.config.js vite.config.js ./
RUN npm run build

# Ensure index.html exists and is suitable for production
RUN if [ ! -f "/app/client/dist/index.html" ]; then \
      mkdir -p /app/client/dist && \
      echo '<!DOCTYPE html>' > /app/client/dist/index.html && \
      echo '<html lang="en">' >> /app/client/dist/index.html && \
      echo '<head>' >> /app/client/dist/index.html && \
      echo '  <meta charset="UTF-8">' >> /app/client/dist/index.html && \
      echo '  <meta name="viewport" content="width=device-width, initial-scale=1.0">' >> /app/client/dist/index.html && \
      echo '  <title>Moby Comps</title>' >> /app/client/dist/index.html && \
      echo '  <style>' >> /app/client/dist/index.html && \
      echo '    body { font-family: sans-serif; margin: 0; padding: 0; background: #f5f5f5; }' >> /app/client/dist/index.html && \
      echo '    #root { min-height: 100vh; }' >> /app/client/dist/index.html && \
      echo '  </style>' >> /app/client/dist/index.html && \
      echo '</head>' >> /app/client/dist/index.html && \
      echo '<body>' >> /app/client/dist/index.html && \
      echo '  <div id="root"></div>' >> /app/client/dist/index.html && \
      echo '  <script>' >> /app/client/dist/index.html && \
      echo '    document.getElementById("root").innerHTML = "<h1 style=\"text-align:center;margin-top:100px;\">Moby Comps</h1><p style=\"text-align:center;\">Loading application...</p>";' >> /app/client/dist/index.html && \
      echo '  </script>' >> /app/client/dist/index.html && \
      echo '</body>' >> /app/client/dist/index.html && \
      echo '</html>' >> /app/client/dist/index.html; \
    fi

# Return to main directory
WORKDIR /app

# Production environment
FROM node:20-alpine

WORKDIR /app

# Copy built client files and server files
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/server.js ./server/

# Install only Express for production
RUN npm install express

# Expose port
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Use the CommonJS server.js file
CMD ["node", "server/server.js"]