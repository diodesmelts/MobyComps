#!/bin/bash
# Super simple start script for Render direct deployment

cd dist
echo "Starting server from $(pwd)"
echo "Node version: $(node -v)"
echo "Environment: $NODE_ENV"

# Start the simple server
node server.js