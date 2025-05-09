#!/bin/bash
set -e

echo "Installing Vite in client directory..."
cd client
npm install
npm install -D vite

echo "Verifying Vite installation..."
if [ -d "node_modules/vite" ]; then
  echo "✅ Vite is successfully installed in client/node_modules/vite"
else
  echo "❌ Vite installation failed!"
  exit 1
fi