#!/bin/bash
# Start script for Render

# Use production build
cd dist
echo "Starting application from $(pwd)"
echo "Node version: $(node -v)"
ls -la

# Start the server
echo "Starting server..."
node production.js