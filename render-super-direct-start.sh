#!/bin/bash
# Super direct start script

cd dist
echo "Starting MobyComps from $(pwd)"
echo "Node version: $(node -v)"
echo "Environment: $NODE_ENV"

# Start the server
node server.js