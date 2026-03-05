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
      sourcemap: true,
      // Optimize for production
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
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