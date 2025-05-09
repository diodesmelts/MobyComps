#!/usr/bin/env node

/*
 * This script handles building the project for production
 * It works around common issues with Render deployments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Log environment information
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Function to create a modified version of App.tsx with direct imports if needed
function createModifiedAppFile() {
  console.log('Creating modified App.tsx for build process...');
  const appPath = path.join(process.cwd(), 'client/src/App.tsx');
  
  if (fs.existsSync(appPath)) {
    let appContent = fs.readFileSync(appPath, 'utf8');
    
    // Replace problematic import statements with direct imports
    appContent = appContent.replace(
      "import { Toaster } from \"@/components/ui/toaster\";",
      "import { Toaster } from \"./components/ui/toaster\";"
    );
    
    appContent = appContent.replace(
      "import { TooltipProvider } from \"@/components/ui/tooltip\";",
      "import { TooltipProvider } from \"./components/ui/tooltip\";"
    );
    
    // Backup the original file
    fs.writeFileSync(appPath + '.backup', fs.readFileSync(appPath));
    
    // Write the modified file
    fs.writeFileSync(appPath, appContent);
    
    console.log('Successfully created modified App.tsx for build');
    return true;
  }
  
  console.log('App.tsx not found, skipping modification');
  return false;
}

// Create a root package.json for Render if it doesn't exist
if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
  console.log('Creating root package.json for Render...');
  try {
    const packageRender = fs.readFileSync(path.join(process.cwd(), 'package-render.json'), 'utf8');
    fs.writeFileSync(path.join(process.cwd(), 'package.json'), packageRender);
    console.log('Successfully created package.json from package-render.json');
  } catch (err) {
    console.error('Failed to create package.json:', err);
  }
}

// Install Vite globally to ensure it's available
try {
  console.log('Installing Vite globally...');
  execSync('npm install -g vite', { stdio: 'inherit' });
} catch (error) {
  console.log('Failed to install Vite globally, continuing anyway');
}

// Install client dependencies and build
try {
  console.log('Installing client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });
  
  // Create tsconfig.json with proper paths if it doesn't exist
  if (!fs.existsSync(path.join(process.cwd(), 'client/tsconfig.json'))) {
    console.log('Creating client tsconfig.json with proper path aliases...');
    const tsConfig = {
      "compilerOptions": {
        "target": "ESNext",
        "useDefineForClassFields": true,
        "lib": ["DOM", "DOM.Iterable", "ESNext"],
        "allowJs": false,
        "skipLibCheck": true,
        "esModuleInterop": false,
        "allowSyntheticDefaultImports": true,
        "strict": true,
        "forceConsistentCasingInFileNames": true,
        "module": "ESNext",
        "moduleResolution": "Node",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        "baseUrl": ".",
        "paths": {
          "@/*": ["src/*"],
          "@shared/*": ["../shared/*"],
          "@assets/*": ["../attached_assets/*"]
        }
      },
      "include": ["src"],
      "references": [{ "path": "./tsconfig.node.json" }]
    };
    fs.writeFileSync(
      path.join(process.cwd(), 'client/tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }
  
  // Check if we need to create tsconfig.node.json
  if (!fs.existsSync(path.join(process.cwd(), 'client/tsconfig.node.json'))) {
    console.log('Creating client tsconfig.node.json...');
    const tsNodeConfig = {
      "compilerOptions": {
        "composite": true,
        "module": "ESNext",
        "moduleResolution": "Node",
        "allowSyntheticDefaultImports": true
      },
      "include": ["vite.config.ts"]
    };
    fs.writeFileSync(
      path.join(process.cwd(), 'client/tsconfig.node.json'), 
      JSON.stringify(tsNodeConfig, null, 2)
    );
  }
  
  // Try to build with existing configuration
  try {
    console.log('Attempting to build client with existing configuration...');
    execSync('cd client && NODE_ENV=production npx vite build', { stdio: 'inherit' });
  } catch (buildError) {
    console.log('Initial build attempt failed:', buildError.message);
    console.log('Trying alternative approach with modified imports...');
    
    // Modify App.tsx to use direct imports
    if (createModifiedAppFile()) {
      try {
        console.log('Building with modified App.tsx...');
        execSync('cd client && NODE_ENV=production npx vite build', { stdio: 'inherit' });
        console.log('Build successful with modified imports!');
      } catch (modifiedBuildError) {
        console.error('Modified build also failed:', modifiedBuildError.message);
        throw modifiedBuildError;
      }
    } else {
      throw buildError;
    }
  }
} catch (error) {
  console.error('Client build failed:', error.message);
  process.exit(1);
}

// Install server dependencies
try {
  console.log('Installing server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('Server dependencies installation failed:', error.message);
  process.exit(1);
}

console.log('Build completed successfully!');