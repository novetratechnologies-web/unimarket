
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Mock the entire redis module
const mockRedis = {
  createClient: () => {
    return {
      on: () => {},
      connect: async () => {},
      get: async () => null,
      set: async () => {},
      quit: async () => {},
      sendCommand: async () => {},
      isOpen: false,
      status: 'closed'
    };
  },
  RedisClient: class {},
  Command: class {}
};

// Override require cache BEFORE natural loads
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(request) {
  // Intercept redis and @redis/* requires
  if (request === 'redis' || request.startsWith('@redis/')) {
    console.log(`🛑 Blocked Redis require: ${request}`);
    return mockRedis;
  }
  return originalRequire.call(this, request);
};

console.log('✅ Redis patched successfully');