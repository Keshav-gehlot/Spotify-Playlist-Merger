import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/login': 'http://127.0.0.1:8000',
      '/callback': 'http://127.0.0.1:8000',
      '/api': 'http://127.0.0.1:8000'
    }
  }
});