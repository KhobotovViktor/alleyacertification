import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    target: 'es2015',
    minify: 'esbuild',
    cssMinify: true,
    modulePreload: true,
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          // NB: react-quill-new is intentionally NOT a manual vendor chunk — it is
          // only used by the lazy-loaded ArticleEditor, so letting it stay inside
          // that async chunk keeps its ~210 KB out of the initial page load
          // (important for throttled connections).
        }
      }
    }
  }
})
