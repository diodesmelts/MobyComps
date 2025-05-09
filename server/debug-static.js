import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to check if the static files exist
export function debugStaticFiles(app) {
  app.get('/debug-static', (req, res) => {
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
}