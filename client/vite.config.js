// ESM syntax for vite.config.js
// Simple configuration without imports that might cause ESM issues
export default {
  plugins: [],
  resolve: {
    alias: {
      '@': './src',
      '@shared': '../shared',
      '@assets': '../attached_assets',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
};