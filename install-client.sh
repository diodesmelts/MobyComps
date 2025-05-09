#!/bin/bash
set -e

echo "Installing Vite and React plugin in client directory..."
cd client
npm install vite@5.0.0 @vitejs/plugin-react -D

echo "Verifying installation..."
npm list vite
npm list @vitejs/plugin-react

echo "Checking build script in package.json..."
grep -n "build" package.json