const fs = require('fs');
const path = require('path');

// Function to verify build files
function verifyBuild() {
  console.log('Verifying build output...');
  
  // Check if dist directory exists
  if (!fs.existsSync('dist')) {
    console.error('❌ dist directory not found');
    return false;
  }

  // Check if dist/index.js exists
  const indexPath = path.join('dist', 'index.js');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ dist/index.js not found');
    return false;
  }

  console.log('✅ Build verification successful');
  console.log(`   - dist/index.js size: ${fs.statSync(indexPath).size} bytes`);
  return true;
}

// Run verification
verifyBuild();