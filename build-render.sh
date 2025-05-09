#!/bin/bash
set -e

echo "Starting simplified build process for Render..."

# Install global dependencies
echo "Installing global dependencies..."
npm install -g vite @vitejs/plugin-react typescript

# Process client directory
echo "Building client application..."
cd client

# Ensure we have the proper Vite config
echo '// ESM syntax for vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});' > vite.config.js

# Fix imports in App.tsx
echo "Fixing imports in App.tsx..."
if [ -f src/App.tsx ]; then
  # Make a backup
  cp src/App.tsx src/App.tsx.bak
  
  # Replace problematic imports
  sed -i 's|import { Toaster } from "@/components/ui/toaster";|import { Toaster } from "./components/ui/toaster";|g' src/App.tsx
  sed -i 's|import { TooltipProvider } from "@/components/ui/tooltip";|import { TooltipProvider } from "./components/ui/tooltip";|g' src/App.tsx
fi

# Install dependencies and build
echo "Installing client dependencies..."
npm install

echo "Building client application..."
NODE_ENV=production npm run build

# Process server directory
cd ../server
echo "Installing server dependencies..."
npm install

echo "Build process completed!"