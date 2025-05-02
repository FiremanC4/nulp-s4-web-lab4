import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    createHtmlPlugin({
      inject: {
        injectData: {
          title: 'My App',
        },
      },
    }),
  ],
  base: '/nulp-s4-web-lab4/',
  build: {
    outDir: 'nulp-s4-web-lab4',
    publicPath: '/',
    emptyOutDir: true, // also necessary
  },
  server: {
    historyApiFallback: true, // Ensures SPA fallback
  },
});
