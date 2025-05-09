FROM node:16

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Install autoprefixer and other required packages
RUN npm install autoprefixer postcss tailwindcss

# Build the client
RUN npx vite build

# Build the server
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Expose the application port
EXPOSE 5000

# Set environment variable
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]