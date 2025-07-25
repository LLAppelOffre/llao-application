import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/token': 'http://localhost:8000',
      '/dashboards': 'http://localhost:8000',
      '/profile': 'http://localhost:8000',
      '/appels_offres': 'http://localhost:8000',
      // Ajoute ici d'autres routes backend si besoin
    },
  },
}); 