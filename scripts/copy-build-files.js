// This script copies the built files to the correct location for the server to find them
const fs = require('fs');
const path = require('path');

// Get the root directory
const rootDir = path.resolve(__dirname, '..');

// Source and destination paths
const srcDir = path.join(rootDir, 'dist', 'public');
const destDir = path.join(rootDir, 'server', 'public');

// Helper function to copy a directory recursively
function copyDirectory(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read all files in the source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

// Main execution
if (fs.existsSync(srcDir)) {
  console.log(`Copying build files from ${srcDir} to ${destDir}...`);
  copyDirectory(srcDir, destDir);
  console.log('Build files copied successfully!');
} else {
  console.error(`Error: Build directory ${srcDir} doesn't exist. Make sure the client has been built.`);
  process.exit(1);
}