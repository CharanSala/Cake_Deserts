import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core': ['three'],
          'r3f-ecosystem': ['@react-three/fiber', '@react-three/drei'],
          'motion-vendor': ['framer-motion', 'gsap'],
        },
      },
    },
  },
});
