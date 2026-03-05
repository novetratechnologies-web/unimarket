// scripts/memory-monitor.js
import { clearAllCache } from '../middleware/cache.js';
import mongoose from 'mongoose';
import os from 'os';
import v8 from 'v8';

const MEMORY_THRESHOLD = 85; // Percentage
const CHECK_INTERVAL = 60000; // 1 minute

async function checkMemory() {
  // Get Node.js heap statistics (the REAL limit)
  const heapStats = v8.getHeapStatistics();
  const memoryUsage = process.memoryUsage();
  
  // Current usage metrics
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const heapLimitMB = Math.round(heapStats.heap_size_limit / 1024 / 1024);
  
  // Calculate percentages correctly
  const usagePercentOfLimit = Math.round((heapUsedMB / heapLimitMB) * 100);
  const allocationPercent = Math.round((heapUsedMB / heapTotalMB) * 100);
  
  // System memory
  const totalMem = os.totalmem() / 1024 / 1024 / 1024;
  const freeMem = os.freemem() / 1024 / 1024 / 1024;
  const usedMem = totalMem - freeMem;
  const systemPercent = ((usedMem / totalMem) * 100).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 MEMORY MONITOR');
  console.log('='.repeat(60));
  
  console.log(`\n💻 SYSTEM MEMORY:`);
  console.log(`   Total: ${totalMem.toFixed(1)}GB`);
  console.log(`   Used: ${usedMem.toFixed(1)}GB (${systemPercent}%)`);
  console.log(`   Free: ${freeMem.toFixed(1)}GB`);
  
  console.log(`\n🚀 NODE.JS HEAP:`);
  console.log(`   Limit: ${heapLimitMB}MB (${Math.round(heapLimitMB / 1024)}GB)`);
  console.log(`   Currently Allocated: ${heapTotalMB}MB`);
  console.log(`   Currently Used: ${heapUsedMB}MB`);
  console.log(`   Free Space: ${heapLimitMB - heapUsedMB}MB`);
  console.log(`   Usage of Limit: ${usagePercentOfLimit}%`); // THIS is the important one!
  console.log(`   Allocation Density: ${allocationPercent}%`);

  // Check against the REAL limit (heap_size_limit), not heapTotal
  if (usagePercentOfLimit > MEMORY_THRESHOLD) {
    console.log(`\n🚨 CRITICAL: Memory threshold exceeded (${usagePercentOfLimit}% of ${heapLimitMB}MB limit)!`);
    console.log(`   Clearing cache and forcing garbage collection...`);
    
    // Clear memory cache
    await clearAllCache()({}, {}, () => {});
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('   ✅ Garbage collection forced');
    }
    
    // Log the cleanup result
    const newUsage = process.memoryUsage();
    const newUsedMB = Math.round(newUsage.heapUsed / 1024 / 1024);
    console.log(`   ✅ Memory reduced to: ${newUsedMB}MB (${Math.round((newUsedMB / heapLimitMB) * 100)}% of limit)`);
  } else {
    console.log(`\n✅ Status: HEALTHY (${usagePercentOfLimit}% of ${heapLimitMB}MB limit)`);
  }
  
  console.log('='.repeat(60) + '\n');
}

// Run immediately on start
console.log('🔍 Starting Memory Monitor...');
checkMemory();

// Run every minute
setInterval(checkMemory, CHECK_INTERVAL);