#!/bin/bash
set -e

echo "Starting server in production mode..."
cd server
# Install tsx globally for production use
npm install -g tsx

# Start the server using server.js which has fallbacks
NODE_ENV=production node server.js