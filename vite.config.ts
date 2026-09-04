import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable source maps for production debugging
    sourcemap: mode === 'production' ? 'hidden' : true,
    
    // Output directory
    outDir: 'dist',
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    
    // Rollup options for advanced bundling
    rollupOptions: {
      output: {
        // Asset file naming for better caching
        assetFileNames: (assetInfo) => {
          const assetName = assetInfo.name || 'asset';
          const info = assetName.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/.test(assetName)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetName)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
        
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // Enable module preload polyfill
    modulePreload: {
      polyfill: true,
    },
    
    // Report compressed sizes
    reportCompressedSize: true,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'clsx',
      'tailwind-merge',
      'lucide-react',
    ],
    exclude: ['lovable-tagger'],
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
  },
  
  // Preview server (for production build testing)
  preview: {
    port: 4173,
    host: true,
    proxy: {
      '/api': { target: 'http://localhost:5003', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5003', changeOrigin: true },
    },
  },
}));
