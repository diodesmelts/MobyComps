import fs from 'fs';
import path from 'path';

// List of critical dependencies for the application
const criticalDependencies = [
  'express',
  'react',
  'react-dom',
  'drizzle-orm',
  'stripe',
  '@tanstack/react-query',
  'passport',
  'zod'
];

try {
  // Read package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log('🔍 Checking critical dependencies...');
  
  const dependencies = {...packageJson.dependencies};
  const missing = [];
  
  criticalDependencies.forEach(dep => {
    if (!dependencies[dep]) {
      missing.push(dep);
    } else {
      console.log(`✅ ${dep}: ${dependencies[dep]}`);
    }
  });
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing critical dependencies:', missing.join(', '));
    process.exit(1);
  } else {
    console.log('✅ All critical dependencies are present!');
  }
  
  // Node.js version check
  console.log('🔍 Checking Node.js version...');
  const nodeVersion = process.version;
  console.log(`Current Node.js version: ${nodeVersion}`);
  
  // Simple version check for Node.js 16+
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (majorVersion < 16) {
    console.warn(`⚠️ Node.js version ${nodeVersion} may be too old for deployment. Recommended: v16+`);
  } else {
    console.log('✅ Node.js version is suitable for deployment!');
  }
  
} catch (error) {
  console.error('❌ Error checking dependencies:', error.message);
  process.exit(1);
}