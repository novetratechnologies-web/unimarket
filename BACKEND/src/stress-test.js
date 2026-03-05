// scripts/stress-test.js
import http from 'http';

const CONCURRENT = 50; // Start with 50 concurrent requests
const TOTAL = 500; // Total requests to send
const URL = 'http://localhost:5000/api/products?limit=10';

let completed = 0;
let failed = 0;
let startTime = Date.now();

console.log(`🚀 Starting stress test: ${CONCURRENT} concurrent, ${TOTAL} total`);

for (let i = 0; i < CONCURRENT; i++) {
  sendRequest();
}

function sendRequest() {
  if (completed + failed >= TOTAL) {
    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Test complete in ${duration}s`);
    console.log(`✅ Successful: ${completed}`);
    console.log(`❌ Failed: ${failed}`);
    return;
  }
  
  http.get(URL, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        completed++;
      } else {
        failed++;
        console.log(`❌ Request failed: ${res.statusCode}`);
      }
      
      if (completed % 50 === 0) {
        console.log(`📊 Progress: ${completed}/${TOTAL} requests`);
      }
      
      sendRequest();
    });
  }).on('error', (err) => {
    failed++;
    console.log(`❌ Request error: ${err.message}`);
    sendRequest();
  });
}