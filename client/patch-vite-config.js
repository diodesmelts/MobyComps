/**
 * Script to create a simplified vite config for production builds
 * This helps prevent issues with ESM/CommonJS compatibility
 */

const fs = require('fs');
const path = require('path');

// Path to create the simplified config
const outputPath = path.join(__dirname, 'vite.config.js');

// Simple Vite config content
const configContent = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Use ESBuild minification which is more reliable
    minify: 'esbuild',
    // Simplify the build to ensure it works
    sourcemap: false,
    // Ensure all paths start with / for proper loading
    assetsDir: 'assets',
  },
});
`;

// Write the file
fs.writeFileSync(outputPath, configContent, 'utf8');
console.log(`Simplified Vite config written to ${outputPath}`);