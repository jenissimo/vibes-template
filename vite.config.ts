import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { qrCodePlugin } from './vite-qr-plugin';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        hmr: true,
      },
    }), 
    tailwindcss(),
    qrCodePlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@game': path.resolve(__dirname, './src/game'),
      '@game/*': path.resolve(__dirname, './src/game/*'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@ui/*': path.resolve(__dirname, './src/ui/*'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@stores/*': path.resolve(__dirname, './src/stores/*'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@assets/*': path.resolve(__dirname, './src/assets/*'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@utils/*': path.resolve(__dirname, './src/utils/*'),
      '@audio': path.resolve(__dirname, './src/audio'),
      '@audio/*': path.resolve(__dirname, './src/audio/*'),
      '@engine': path.resolve(__dirname, './src/engine'),
      '@engine/*': path.resolve(__dirname, './src/engine/*'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@shared/*': path.resolve(__dirname, './src/shared/*'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/styles/*': path.resolve(__dirname, './src/styles/*'),
      '@/theme': path.resolve(__dirname, './src/styles/theme.css'),
    },
  },
  server: {
    host: true,
    hmr: {
      overlay: true,
      port: 24678,
    },
  },
  optimizeDeps: {
    force: true,
  },
  build: {
    sourcemap: true,
    copyPublicDir: true,
  },
  publicDir: 'public',
  assetsInclude: ['**/*.svg'],
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  css: {
    devSourcemap: true,
  },
});
