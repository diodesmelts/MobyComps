const { execSync } = require('child_process');
console.log('Installing Vite and React plugin in client directory...');
try {
  execSync('cd client && npm install vite @vitejs/plugin-react -D', { stdio: 'inherit' });
  console.log('Installation completed successfully');
} catch (error) {
  console.error('Installation failed:', error.message);
  process.exit(1);
}