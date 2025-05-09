/**
 * Enhanced production build script for MobyComps
 * This script creates a production-ready build with proper asset paths
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Log with nice formatting
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  let color = colors.reset;
  
  switch (type) {
    case 'success':
      color = colors.green;
      break;
    case 'warning':
      color = colors.yellow;
      break;
    case 'error':
      color = colors.red;
      break;
    case 'info':
      color = colors.blue;
      break;
  }
  
  console.log(`${colors.bright}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

// Main build function
async function buildForProduction() {
  try {
    log('Starting enhanced production build', 'info');
    
    // Create necessary directories
    const distDir = path.resolve(__dirname, '../dist');
    const publicDir = path.resolve(distDir, 'public');
    
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
      log('Created dist directory', 'success');
    }
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
      log('Created dist/public directory', 'success');
    }
    
    // Build the client
    log('Building client with Vite...', 'info');
    
    // Check if we have a production template
    const productionTemplate = path.resolve(__dirname, '../client/index.production.html');
    if (fs.existsSync(productionTemplate)) {
      log('Using production HTML template for build', 'info');
      // Copy the production template to the client directory as index.html
      fs.copyFileSync(
        productionTemplate,
        path.resolve(__dirname, '../client/index.html.template')
      );
      
      // Run the build with the template
      execSync('npx vite build --template index.html.template', { 
        stdio: 'inherit',
        cwd: process.cwd() 
      });
      
      // Clean up
      fs.unlinkSync(path.resolve(__dirname, '../client/index.html.template'));
    } else {
      log('No production template found, using default', 'warning');
      execSync('npx vite build', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
    }
    
    log('Client build complete', 'success');
    
    // Build the server
    log('Building server with esbuild...', 'info');
    execSync('npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log('Server build complete', 'success');
    
    // Copy necessary files
    log('Copying shared directory to dist...', 'info');
    execSync('cp -r shared dist/', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log('Copying public directory to ensure static files are available...', 'info');
    if (fs.existsSync(path.resolve(__dirname, '../public'))) {
      execSync('cp -r public/* dist/public/ 2>/dev/null || true', {
        stdio: 'inherit',
        cwd: process.cwd(),
        shell: true
      });
    }
    
    // Generate package.json for the dist directory
    log('Creating minimal package.json in dist directory...', 'info');
    const packageJson = {
      "name": "mobycomps",
      "version": "1.0.0",
      "type": "module",
      "description": "Prize Competitions Platform",
      "main": "production.js",
      "scripts": {
        "start": "node production.js"
      }
    };
    
    fs.writeFileSync(
      path.resolve(distDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    // Create directory for uploads if it doesn't exist
    const uploadsDir = path.resolve(distDir, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      log('Created uploads directory', 'success');
    }
    
    // Verify the build
    const builtFiles = fs.readdirSync(publicDir);
    log(`Built files in dist/public: ${builtFiles.join(', ')}`, 'info');
    
    // Process index.html to fix any asset references
    const indexHtmlPath = path.resolve(publicDir, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      log('index.html found in build output', 'success');
      
      // Read the index.html file
      let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      
      // Check if the file needs to be processed
      const hasDevReferences = indexHtml.includes('/@fs/') || indexHtml.includes('/@vite/');
      
      if (hasDevReferences) {
        log('Development references found in index.html, fixing...', 'warning');
        
        // Fix development references
        indexHtml = indexHtml.replace(/src="[^"]*\/@fs\/[^"]*"/g, 'src="/assets/index.js"');
        indexHtml = indexHtml.replace(/href="[^"]*\/@fs\/[^"]*"/g, 'href="/assets/index.css"');
        
        // Fix any other development references
        indexHtml = indexHtml.replace(/src="[^"]*\/@vite\/[^"]*"/g, 'src="/assets/index.js"');
        
        // Save the processed file
        fs.writeFileSync(indexHtmlPath, indexHtml);
        log('Fixed development references in index.html', 'success');
      }
      
      // Add script to handle asset loading errors
      if (!indexHtml.includes('window.__ASSET_ERROR_HANDLER__')) {
        log('Adding asset error handler to index.html', 'info');
        const errorHandlerScript = `
  <script>
    window.__ASSET_ERROR_HANDLER__ = true;
    window.addEventListener('error', function(event) {
      if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
        console.error('Asset loading error:', event.target.src || event.target.href);
        
        // If we have a fallback, use it
        if (event.target.getAttribute('data-fallback')) {
          const fallback = event.target.getAttribute('data-fallback');
          console.log('Using fallback:', fallback);
          if (event.target.tagName === 'SCRIPT') {
            event.target.src = fallback;
          } else {
            event.target.href = fallback;
          }
        }
      }
    }, true);
  </script>`;
        
        // Insert error handler right after the opening head tag
        indexHtml = indexHtml.replace('<head>', '<head>' + errorHandlerScript);
        fs.writeFileSync(indexHtmlPath, indexHtml);
        log('Added asset error handler to index.html', 'success');
      }
    } else {
      log('WARNING: index.html not found in build output', 'warning');
      
      // Create a minimal index.html as a fallback
      const minimalHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>MobyComps Prize Competitions</title>
    <script>
      // Fallback to the static HTML version
      window.location.href = '/fallback.html';
    </script>
  </head>
  <body>
    <noscript>
      <meta http-equiv="refresh" content="0;url=/fallback.html">
      <p>Redirecting to <a href="/fallback.html">fallback version</a></p>
    </noscript>
  </body>
</html>`;
      
      fs.writeFileSync(path.resolve(publicDir, 'index.html'), minimalHtml);
      log('Created minimal index.html that redirects to fallback.html', 'success');
    }
    
    // Check for assets directory
    const assetsDir = path.resolve(publicDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      const assetFiles = fs.readdirSync(assetsDir);
      log(`Found ${assetFiles.length} files in assets directory`, 'success');
      
      // Look for main entry points
      const jsFiles = assetFiles.filter(file => file.endsWith('.js'));
      const cssFiles = assetFiles.filter(file => file.endsWith('.css'));
      
      if (jsFiles.length > 0) {
        log(`Main JavaScript files: ${jsFiles.join(', ')}`, 'info');
      } else {
        log('WARNING: No JavaScript files found in assets directory', 'warning');
      }
      
      if (cssFiles.length > 0) {
        log(`Main CSS files: ${cssFiles.join(', ')}`, 'info');
      }
    } else {
      log('WARNING: assets directory not found in build output', 'warning');
      fs.mkdirSync(assetsDir, { recursive: true });
      log('Created empty assets directory', 'info');
    }
    
    log('Production build completed successfully 🎉', 'success');
    
  } catch (error) {
    log(`Build failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

buildForProduction();