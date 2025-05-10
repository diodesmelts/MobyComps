#!/bin/bash

echo "=== STARTING PRODUCTION SERVER ==="
echo "Node version: $(node -v)"
echo "Current directory: $(pwd)"

# Change to the production directory
cd production

# Make sure we have all the necessary dependencies
echo "Checking dependencies..."
npm install

# Start the server
echo "Starting server..."
NODE_ENV=production node server.js