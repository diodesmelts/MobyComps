import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// This configuration is specifically for production builds on Render
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@shared', replacement: path.resolve(__dirname, '../shared') },
      { find: '@assets', replacement: path.resolve(__dirname, '../attached_assets') },
      // Add explicit mappings for components that use alias imports
      { find: '@/components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@/hooks', replacement: path.resolve(__dirname, 'src/hooks') },
      { find: '@/lib', replacement: path.resolve(__dirname, 'src/lib') },
      { find: '@/pages', replacement: path.resolve(__dirname, 'src/pages') },
      { find: '@/contexts', replacement: path.resolve(__dirname, 'src/contexts') },
    ],
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});