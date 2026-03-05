import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  console.log('Testing MongoDB connection...');
  console.log('URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/unimarket');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/unimarket');
    console.log('✅ Connected successfully!');
    console.log('Connection state:', mongoose.connection.readyState);
    
    // List databases
    const adminDb = mongoose.connection.db.admin();
    const dbs = await adminDb.listDatabases();
    console.log('Available databases:', dbs.databases.map(db => db.name));
    
    await mongoose.disconnect();
    console.log('✅ Disconnected');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
};

testConnection();