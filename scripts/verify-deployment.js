import https from 'https';
import http from 'http';
import { URL } from 'url';

const appUrl = process.argv[2];

if (!appUrl) {
  console.error('❌ Error: Please provide the deployed application URL as a parameter');
  console.error('Example: node verify-deployment.js https://your-app.onrender.com');
  process.exit(1);
}

const makeRequest = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
};

const verifyEndpoints = async () => {
  try {
    console.log(`🔄 Verifying deployment at ${appUrl}...`);
    
    // Define endpoints to check
    const endpoints = [
      { url: '/', name: 'Home page', expectedStatus: 200 },
      { url: '/health', name: 'Health check', expectedStatus: 200 },
      { url: '/api/competitions', name: 'Competitions API', expectedStatus: 200 },
    ];
    
    let allPassed = true;
    
    for (const endpoint of endpoints) {
      try {
        const fullUrl = new URL(endpoint.url, appUrl).toString();
        console.log(`🔄 Checking ${endpoint.name} at ${fullUrl}...`);
        
        const response = await makeRequest(fullUrl);
        
        if (response.status === endpoint.expectedStatus) {
          console.log(`✅ ${endpoint.name}: Status ${response.status} (Expected: ${endpoint.expectedStatus})`);
        } else {
          console.error(`❌ ${endpoint.name}: Status ${response.status} (Expected: ${endpoint.expectedStatus})`);
          allPassed = false;
        }
        
        // For the health endpoint, verify the response format
        if (endpoint.url === '/health' && response.status === 200) {
          try {
            const healthData = JSON.parse(response.body);
            if (healthData.status === 'ok' && healthData.time) {
              console.log(`✅ Health check response format is valid`);
            } else {
              console.error(`❌ Health check response format is invalid`);
              allPassed = false;
            }
          } catch (e) {
            console.error(`❌ Health check response is not valid JSON`);
            allPassed = false;
          }
        }
      } catch (error) {
        console.error(`❌ Error checking ${endpoint.name}: ${error.message}`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log('\n✅ All checks passed! The deployment appears to be working correctly.');
    } else {
      console.log('\n❌ Some checks failed. Please review the logs above.');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error verifying deployment: ${error.message}`);
    process.exit(1);
  }
};

verifyEndpoints();