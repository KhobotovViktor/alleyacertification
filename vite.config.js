import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    target: 'es2015',
    minify: false, // Disabling minification to check if it's a content-filtering issue
    cssMinify: true,
    modulePreload: false,
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-quill': ['react-quill-new'],
          'vendor-icons': ['lucide-react'],
        }
      }
    }
  }
})
