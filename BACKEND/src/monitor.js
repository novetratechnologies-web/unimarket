// scripts/monitor.js - No external dependencies!
import chalk from 'chalk';
import { exec } from 'child_process';
import os from 'os';
import fs from 'fs';

let lastMemory = 0;
let growthCount = 0;
let peakMemory = 0;
let startTime = Date.now();

console.log(chalk.cyan('📊 Memory Monitor Started - Press Ctrl+C to stop\n'));

// Get process info using OS commands (no ps-list needed)
const getProcessInfo = () => {
  return new Promise((resolve) => {
    const platform = os.platform();
    
    if (platform === 'win32') {
      // Windows - use tasklist
      exec('tasklist /FO CSV /NH', (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        
        try {
          const lines = stdout.split('\n').filter(line => line.trim());
          const processes = lines.map(line => {
            const match = line.match(/"([^"]*)"/g);
            if (match && match.length >= 5) {
              return {
                name: match[0].replace(/"/g, ''),
                pid: parseInt(match[1].replace(/"/g, '')),
                memory: parseInt(match[4].replace(/[^0-9]/g, '')) * 1024 // Convert KB to bytes
              };
            }
            return null;
          }).filter(p => p && p.name && p.name.toLowerCase().includes('node'));
          
          resolve(processes[0] || null);
        } catch (e) {
          resolve(null);
        }
      });
    } else {
      // Linux/Mac - use ps
      exec('ps -eo pid,pcpu,rss,comm | grep node', (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        
        try {
          const lines = stdout.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 4 && parts[3].includes('server.js')) {
              resolve({
                pid: parseInt(parts[0]),
                cpu: parseFloat(parts[1]),
                memory: parseInt(parts[2]) * 1024, // RSS is in KB, convert to bytes
                name: parts[3]
              });
              return;
            }
          }
          resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    }
  });
};

// Main monitoring loop
setInterval(async () => {
  try {
    const processInfo = await getProcessInfo();
    
    if (!processInfo) {
      console.log(chalk.yellow('⚠️ No Node.js server process found'));
      return;
    }

    const memoryMB = Math.round(processInfo.memory / 1024 / 1024);
    const cpuPercent = processInfo.cpu || 0;
    const runtime = Math.round((Date.now() - startTime) / 1000 / 60); // minutes
    
    // Track peak
    if (memoryMB > peakMemory) peakMemory = memoryMB;
    
    // Calculate growth
    const growth = memoryMB - lastMemory;
    const growthRate = growth > 0 ? `+${growth}MB` : `${growth}MB`;
    
    // Color coding based on memory usage
    let memoryColor = chalk.green;
    if (memoryMB > 3000) memoryColor = chalk.red.bold;
    else if (memoryMB > 2000) memoryColor = chalk.yellow;
    
    // Memory status bar
    const barLength = 30;
    const usedBars = Math.floor((memoryMB / 4000) * barLength);
    const bar = '█'.repeat(usedBars) + '░'.repeat(barLength - usedBars);
    
    // System memory
    const totalMem = os.totalmem() / 1024 / 1024 / 1024;
    const freeMem = os.freemem() / 1024 / 1024 / 1024;
    const memPercent = ((totalMem - freeMem) / totalMem * 100).toFixed(1);
    
    // Clear console and show updated stats
  

  
    // Warnings
    if (memoryMB > 3500) {
    } else if (memoryMB > 3000) {

    } else if (memoryMB < lastMemory - 100) {
     
    }
    
    // Alert on rapid growth
    if (growth > 100) {
      growthCount++;
      console.log(chalk.red(`\n🔥 RAPID GROWTH: +${growth}MB in 5s (x${growthCount})`));
    } else {
      growthCount = 0;
    }
    
    console.log(chalk.cyan('\n═'.repeat(60)));
    console.log(chalk.gray('Press Ctrl+C to stop monitoring'));
    
    lastMemory = memoryMB;
    
  } catch (error) {
    console.error('Monitor error:', error.message);
  }
}, 5000);