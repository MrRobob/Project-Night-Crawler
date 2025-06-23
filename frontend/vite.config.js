// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Der 'css.postcss'-Block sollte hier NICHT vorhanden sein.
  // Vite findet die postcss.config.js automatisch im selben Verzeichnis.
});
