import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/passenger.auth': {
        target: 'https://dev2-mm.srvdev.ru',
        changeOrigin: true,
        secure: true,
      },
      '/passenger': {
        target: 'https://dev2-mm.srvdev.ru',
        changeOrigin: true,
        secure: true,
      },
      '/maas': {
        target: 'https://maas.brndev.ru',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/maas/, ''),
      },
    },
  },
});
