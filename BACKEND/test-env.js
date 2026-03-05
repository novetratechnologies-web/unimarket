// test-env.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 ENVIRONMENT VARIABLE TEST');
console.log('============================');

// Check if .env file exists
const envPath = resolve(__dirname, '.env');
console.log(`📁 Looking for .env at: ${envPath}`);
console.log(`📁 File exists: ${fs.existsSync(envPath)}`);

if (fs.existsSync(envPath)) {
  // Read .env file content (masking password)
  const envContent = fs.readFileSync(envPath, 'utf8');
  const maskedContent = envContent.replace(/ZkHGu5ZWOJ59wMzN/g, '********');
  console.log('\n📄 .env file content:');
  console.log(maskedContent);
}

// Load dotenv
console.log('\n🔄 Loading dotenv...');
dotenv.config();

// Check if variables are loaded
console.log('\n📊 Environment variables after dotenv.config():');
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Found' : '❌ Missing'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Found' : '❌ Missing'}`);
console.log(`PORT: ${process.env.PORT ? '✅ Found' : '❌ Missing'}`);

// Show masked URI if exists
if (process.env.MONGODB_URI) {
  const maskedURI = process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//****:****@');
  console.log(`\n🔗 MONGODB_URI: ${maskedURI}`);
}