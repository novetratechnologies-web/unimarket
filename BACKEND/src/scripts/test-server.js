import express from 'express';

const app = express();
const PORT = 5000;
const HOST = '0.0.0.0';

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Test server works!' });
});

app.get('/api/ping', (req, res) => {
  res.json({ success: true, message: 'pong' });
});

app.listen(PORT, HOST, () => {
  console.log(`✅ Test server running at http://${HOST}:${PORT}`);
  console.log(`   Try: http://localhost:${PORT}/health`);
});

// Get network IP
import { networkInterfaces } from 'os';
const nets = networkInterfaces();
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === 'IPv4' && !net.internal) {
      console.log(`   Network: http://${net.address}:${PORT}/health`);
    }
  }
}