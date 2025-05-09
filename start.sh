#!/bin/bash
set -e

echo "Starting server..."
cd server
NODE_ENV=production npm start