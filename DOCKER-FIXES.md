# Docker Deployment Fixes

This document outlines the fixes we've made to ensure successful deployment of MobyComps on Render using Docker.

## Issues Identified

1. **ES Module vs CommonJS Issues**: The production build script was using CommonJS-style `require()` statements while the project is configured to use ES modules with `"type": "module"` in package.json.

2. **Asset Path References**: The Vite build process was using development-specific paths in production HTML, causing the browser to look for assets in the wrong locations.

3. **Static File Serving**: Multiple layers of fallbacks were needed to ensure content is always available, even when the full React app couldn't load.

## Fixes Implemented

### 1. ES Module Compatibility Fix

Updated the production build script to use ES module imports:

```javascript
// Changed from:
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// To:
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Added ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### 2. Direct Build Commands in Dockerfile

To avoid module system issues, simplified the Dockerfile to use direct commands:

```dockerfile
# Use direct commands instead of the production build script
RUN echo "Building client and server directly..."

# Build the client with Vite
RUN npx vite build

# Build the server
RUN npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js

# Copy necessary files
RUN cp -r shared dist/ && \
    mkdir -p dist/uploads && \
    echo '{"name":"mobycomps","version":"1.0.0","type":"module","main":"production.js"}' > dist/package.json
```

### 3. HTML Post-Processing

Added post-processing to fix asset path references in the HTML:

```dockerfile
# Add error handling to index.html
RUN if [ -f "dist/public/index.html" ]; then \
      # Create a backup
      cp dist/public/index.html dist/public/index.html.bak && \
      # Add error handling for assets
      echo "Adding error handler to index.html" && \
      sed -i 's/<head>/<head><script>window.__ASSET_ERROR_HANDLER__ = true; window.addEventListener("error", function(event) { if (event.target && (event.target.tagName === "SCRIPT" || event.target.tagName === "LINK")) { console.error("Asset loading error:", event.target.src || event.target.href); } }, true);<\/script>/' dist/public/index.html && \
      # Fix any development references
      sed -i 's|src="[^"]*/@fs/[^"]*"|src="/assets/index.js"|g' dist/public/index.html && \
      sed -i 's|href="[^"]*/@fs/[^"]*"|href="/assets/index.css"|g' dist/public/index.html && \
      echo "Processed index.html successfully"; \
    else \
      echo "index.html not found, creating a fallback version" && \
      mkdir -p dist/public && \
      echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>MobyComps Prize Competitions</title><script>window.location.href = "/fallback.html";</script></head><body><noscript><meta http-equiv="refresh" content="0;url=/fallback.html"><p>Redirecting to <a href="/fallback.html">fallback version</a></p></noscript></body></html>' > dist/public/index.html; \
    fi
```

### 4. Multiple Fallback Layers

Created a series of fallback mechanisms to ensure content is always displayed:

1. **Static HTML Pages**:
   - `public/index.html` - A complete static HTML version of the site
   - `public/fallback.html` - A simpler status page with debug links

2. **Server-side Fallbacks**:
   - Enhanced `server/production.ts` to serve static files before routes
   - Added multiple debug endpoints for troubleshooting
   - Created in-memory HTML generation for worst-case scenarios

## Key Dockerfile Changes

1. **Simplified Build Process**: Used direct commands instead of a custom build script
2. **HTML Post-Processing**: Added a step to fix asset paths directly in the HTML files
3. **Extensive Debugging**: Added commands to print file structure and content for easier troubleshooting
4. **Fallback Generation**: Created a minimal index.html as a last resort

## Testing the Deployment

After pushing these changes to GitHub and deploying to Render, you should see:

1. The static HTML version is now displaying correctly
2. Debug endpoints are available for troubleshooting
3. The full React application may still need fine-tuning to load JavaScript assets correctly

## Next Steps

1. Continue to refine the Vite build process to ensure correct asset paths in production
2. Add more error reporting to help diagnose any remaining issues
3. Consider creating a dedicated build step in Render to avoid reliance on Docker build steps