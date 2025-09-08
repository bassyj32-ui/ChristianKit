import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Reduce chunk size warning limit to catch large bundles
    chunkSizeWarningLimit: 500,
    // Aggressive chunk splitting for better loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          // Routing
          'router': ['react-router-dom'],
          // State management
          'zustand': ['zustand'],
          // Supabase (split for better caching)
          'supabase-auth': ['@supabase/supabase-js'],
          // Analytics
          'analytics': ['react-ga4'],
          // Utils
          'utils': ['lodash']
        },
        // Optimized file naming for caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    // Enable source maps for debugging
    sourcemap: false,
    // Minify for smaller bundles
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  // Ensure proper base URL for production
  base: '/',
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'zustand'
    ],
    exclude: ['firebase'] // Exclude Firebase since we removed it
  },
  // Enable preloading for better performance
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  }
})
