import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to serve static files with fallbacks
export function setupStaticHandler(app) {
  // Add a debug route to check static file locations
  app.get('/static-debug', (req, res) => {
    // Possible locations for the static files
    const possiblePaths = [
      path.resolve(__dirname, 'public'),
      path.resolve(__dirname, '../dist/public'),
      path.resolve(__dirname, '../public')
    ];
    
    const result = {
      checkedPaths: [],
      staticFiles: false,
      indexHtml: false,
      assetFiles: false,
      serverDirectory: __dirname,
      environment: process.env.NODE_ENV || 'unknown'
    };
    
    // Check each path
    for (const dirPath of possiblePaths) {
      const pathInfo = {
        path: dirPath,
        exists: fs.existsSync(dirPath),
        files: []
      };
      
      if (pathInfo.exists) {
        try {
          // Get files in the directory
          const files = fs.readdirSync(dirPath);
          pathInfo.files = files;
          
          if (files.includes('index.html')) {
            result.indexHtml = true;
            // Read the first 100 bytes of index.html to check if it's a valid file
            try {
              const indexPath = path.join(dirPath, 'index.html');
              const fd = fs.openSync(indexPath, 'r');
              const buffer = Buffer.alloc(100);
              fs.readSync(fd, buffer, 0, 100, 0);
              fs.closeSync(fd);
              pathInfo.indexHtmlPreview = buffer.toString().substring(0, 100);
            } catch (err) {
              pathInfo.indexHtmlError = err.message;
            }
          }
          
          // Check for asset files
          if (files.includes('assets')) {
            pathInfo.assetsDirectory = true;
            const assetsPath = path.join(dirPath, 'assets');
            try {
              const assetFiles = fs.readdirSync(assetsPath);
              pathInfo.assetFiles = assetFiles;
              if (assetFiles.length > 0) {
                result.assetFiles = true;
              }
            } catch (err) {
              pathInfo.assetError = err.message;
            }
          }
          
          result.staticFiles = result.staticFiles || (pathInfo.files.length > 0);
        } catch (err) {
          pathInfo.error = err.message;
        }
      }
      
      result.checkedPaths.push(pathInfo);
    }
    
    res.json(result);
  });
  
  // Add explicit routes for static files
  app.get('/index.html', (req, res) => {
    // Try to find index.html in various locations
    const possiblePaths = [
      path.resolve(__dirname, 'public/index.html'),
      path.resolve(__dirname, '../dist/public/index.html'),
      path.resolve(__dirname, '../public/index.html')
    ];
    
    for (const indexPath of possiblePaths) {
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
    
    // If not found, return 404
    res.status(404).send('Index.html not found in any of the expected locations');
  });
  
  // Add explicit routes for asset files
  app.get('/assets/*', (req, res) => {
    const assetPath = req.path.substring('/assets/'.length);
    
    // Try to find the asset in various locations
    const possiblePaths = [
      path.resolve(__dirname, 'public/assets', assetPath),
      path.resolve(__dirname, '../dist/public/assets', assetPath),
      path.resolve(__dirname, '../public/assets', assetPath)
    ];
    
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }
    
    // If not found, return 404
    res.status(404).send(`Asset ${assetPath} not found in any of the expected locations`);
  });
  
  // Redirect root path to index.html
  app.get('/', (req, res) => {
    res.redirect('/index.html');
  });
}