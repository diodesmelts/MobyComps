// Simple vite.config.js without TypeScript
module.exports = {
  plugins: [require('@vitejs/plugin-react')()],
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '../shared',
      '@assets': '../attached_assets'
    }
  },
  build: {
    outDir: 'dist'
  }
};