import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/login': 'http://localhost:8000',
      '/callback': 'http://localhost:8000',
      '/api': 'http://localhost:8000'
    }
  }
});