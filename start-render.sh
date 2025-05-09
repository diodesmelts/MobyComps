#!/bin/bash
set -e

echo "Starting server in production mode..."
cd server
NODE_ENV=production node server.js