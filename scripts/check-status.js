import https from 'https';
import http from 'http';
import { URL } from 'url';

const checkServerStatus = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = new URL(url).protocol === 'https:' ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            body: data,
          };
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
};

const url = process.argv[2] || 'http://localhost:8080/health';

checkServerStatus(url)
  .then((result) => {
    console.log('✅ Server status check:');
    console.log(`Status code: ${result.status}`);
    if (result.status === 200) {
      try {
        const body = JSON.parse(result.body);
        console.log('Health status:', body.status);
        console.log('Server time:', body.time);
      } catch (e) {
        console.log('Response body:', result.body);
      }
    } else {
      console.log('Response body:', result.body);
    }
  })
  .catch((error) => {
    console.error('❌ Failed to check server status:', error.message);
    process.exit(1);
  });