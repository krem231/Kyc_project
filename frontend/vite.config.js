import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  server: {
    // Development server configuration
    port: 5173,
    strictPort: false,
    host: 'localhost',
    
    // CORS proxy configuration (nếu backend khác port)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    }
  },

  build: {
    // Build configuration
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    
    rollupOptions: {
      output: {
        manualChunks: {
          // Code splitting for better caching
          'react-vendors': ['react', 'react-dom', 'react-router-dom'],
          'form-vendors': ['react-hook-form', '@hookform/resolvers', 'yup'],
          'ui-vendors': ['axios', 'react-google-recaptcha']
        }
      }
    }
  },

  // Environment variables prefix
  define: {
    'process.env': {}
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'react-hook-form',
      '@hookform/resolvers',
      'yup',
      'react-google-recaptcha'
    ]
  }
})