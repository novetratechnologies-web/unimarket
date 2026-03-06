// Create a new file: ../FRONTEND/src/utils/headers.js

export const addDeviceHeaders = (config) => {
  // Only add in development or if explicitly enabled
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEVICE_HEADERS === 'true') {
    // Generate or get client ID
    let clientId = localStorage.getItem('client_id');
    if (!clientId) {
      clientId = crypto.randomUUID ? crypto.randomUUID() : 
                 Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('client_id', clientId);
    }
    
    config.headers['X-Client-ID'] = clientId;
    
    // Add screen size
    if (typeof window !== 'undefined') {
      config.headers['X-Screen-Size'] = `${window.screen.width}x${window.screen.height}`;
    }
  }
  
  return config;
};