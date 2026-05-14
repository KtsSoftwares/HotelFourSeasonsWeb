import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This creates a direct path to node_modules
      '~bootstrap-icons': resolve(__dirname, 'node_modules/bootstrap-icons'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // Groups all node_modules into a 'vendor' chunk
          }
          if (id.includes('firebase')) {
            return 'firebase';
          }
          if (id.includes('bootstrap')) {
            return 'bootstrap';
          }
        },
      },
    },
  }
})
