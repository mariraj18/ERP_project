import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  // 👇 VERY IMPORTANT FOR RAILWAY
  preview: {
    host: true,
    port: Number(process.env.PORT) || 4173,
  }
});
