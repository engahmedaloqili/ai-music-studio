import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // مسارات نسبية حتى يعمل البناء داخل Electron عبر file://
  base: './',
  plugins: [react(), tailwindcss()],
});
