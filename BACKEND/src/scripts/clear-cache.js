// scripts/clear-cache.js
import { clearAllCache } from '../middleware/cache.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function clearCache() {
  console.log('🧹 Clearing all cache...');
  
  const before = process.memoryUsage();
  console.log(`📊 Before: ${Math.round(before.heapUsed / 1024 / 1024)}MB used`);

  // Clear cache
  await clearAllCache()({}, {}, () => {});
  
  // Force garbage collection
  if (global.gc) {
    global.gc();
    console.log('🧹 Garbage collection forced');
  }

  const after = process.memoryUsage();
  console.log(`📊 After: ${Math.round(after.heapUsed / 1024 / 1024)}MB used`);
  console.log(`✅ Freed: ${Math.round((before.heapUsed - after.heapUsed) / 1024 / 1024)}MB`);
  
  process.exit(0);
}

clearCache();