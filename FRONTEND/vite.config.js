import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          // In development, proxy to local backend
          target: env.VITE_ENV === 'production' 
            ? 'https://unimarket-vtx5.onrender.com' 
            : 'http://localhost:5000',
          changeOrigin: true,
          secure: env.VITE_ENV === 'production',
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      // ✅ FIXED: manualChunks should be a function, not an object
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // This is the correct function format
            if (id.includes('node_modules')) {
              // Split vendor chunks for better caching
              if (id.includes('react')) {
                return 'vendor-react';
              }
              if (id.includes('axios')) {
                return 'vendor-axios';
              }
              if (id.includes('react-router')) {
                return 'vendor-router';
              }
              // All other node_modules go to vendor
              return 'vendor';
            }
          },
        },
      },
    },
    // Define global constants
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_ENV),
    },
  };
});