#!/bin/bash

# Install TSX for running TypeScript directly
npm install -g tsx

# Run the server directly from TypeScript source
echo "Starting server directly from source..."
NODE_ENV=production npx tsx server/index.ts