import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-toast',
            '@radix-ui/react-avatar',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-accordion',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-slider',
          ],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-utils': ['clsx', 'tailwind-merge', 'class-variance-authority', 'lucide-react', 'date-fns', 'dayjs'],
          'vendor-state': ['@tanstack/react-query'],
          'vendor-media': ['react-player', 'embla-carousel-react', 'embla-carousel-autoplay'],
          'vendor-charts': ['recharts'],
          'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-other': ['axios', 'framer-motion', 'sonner', 'cmdk', 'vaul', 'input-otp', 'react-day-picker', 'react-resizable-panels', 'dompurify', 'jose', 'next-themes'],
          
          // App chunks - split by route/page
          'pages-home': ['./src/pages/HomePage.tsx'],
          'pages-articles': ['./src/pages/ArticleDetail.tsx', './src/pages/Latest.tsx', './src/pages/Breaking.tsx', './src/pages/National.tsx', './src/pages/Entertainment.tsx', './src/pages/World.tsx'],
          'pages-sports': ['./src/pages/Sports.tsx', './src/pages/MatchDetail.tsx'],
          'pages-media': ['./src/pages/Videos.tsx', './src/pages/LiveTv.tsx', './src/pages/ReelsPage.tsx', './src/pages/ReelDetail.tsx'],
          'pages-short': ['./src/pages/ShortPostsPage.tsx', './src/pages/ShortPostDetail.tsx'],
          'pages-auth': ['./src/pages/Login.tsx', './src/pages/Register.tsx', './src/pages/ForgotPassword.tsx', './src/pages/ResetPassword.tsx', './src/pages/Profile.tsx'],
          'pages-admin': [
            './src/pages/admin/Dashboard.tsx',
            './src/pages/admin/Articles.tsx',
            './src/pages/admin/Categories.tsx',
            './src/pages/admin/Users.tsx',
            './src/pages/admin/Advertisements.tsx',
            './src/pages/admin/Videos.tsx',
            './src/pages/admin/Comments.tsx',
            './src/pages/admin/Analytics.tsx',
            './src/pages/admin/Settings.tsx',
            './src/pages/admin/ContactMessages.tsx',
            './src/pages/admin/ShortPosts.tsx',
            './src/pages/admin/Reels.tsx',
            './src/pages/admin/LiveTv.tsx',
            './src/pages/admin/Sports.tsx',
            './src/pages/admin/Careers.tsx',
            './src/pages/admin/Photos.tsx',
            './src/pages/admin/CategoryDetail.tsx',
          ],
          'pages-other': ['./src/pages/Search.tsx', './src/pages/Contact.tsx', './src/pages/Career.tsx', './src/pages/CareerDetail.tsx', './src/pages/PrivacyPolicy.tsx', './src/pages/CategoryPage.tsx', './src/pages/NotFound.tsx', './src/pages/Unauthorized.tsx'],
          
          // Components
          'components-ui': [
            './src/components/ui/button.tsx',
            './src/components/ui/card.tsx',
            './src/components/ui/badge.tsx',
            './src/components/ui/avatar.tsx',
            './src/components/ui/skeleton.tsx',
            './src/components/ui/separator.tsx',
            './src/components/ui/tabs.tsx',
            './src/components/ui/toaster.tsx',
            './src/components/ui/input.tsx',
            './src/components/ui/label.tsx',
            './src/components/ui/dropdown-menu.tsx',
            './src/components/ui/dialog.tsx',
            './src/components/ui/tooltip.tsx',
            './src/components/ui/toast.tsx',
          ],
          'components-layout': ['./src/components/Layout.tsx', './src/components/NavbarTop.tsx'],
          'components-features': ['./src/components/BreakingNews.tsx', './src/components/ShortPostsCarousel.tsx', './src/components/ReelsCarousel.tsx', './src/components/InstagramReels.tsx', './src/components/VideoPlayer.tsx', './src/components/AdvertisementDisplay.tsx', './src/components/CommentSection.tsx', './src/components/NewsletterSubscribe.tsx', './src/components/LanguageSwitcher.tsx', './src/components/UserMenu.tsx', './src/components/ProtectedRoute.tsx', './src/components/AuthGuard.tsx', './src/components/ErrorBoundary.tsx', './src/components/CookieConsent.tsx', './src/components/ScrollToTop.tsx', './src/components/MetadataManager.tsx', './src/components/BreakingNewsTicker.tsx', './src/components/SEO.tsx'],
          
          // Services and hooks
          'services': ['./src/services/categoryService.ts', './src/services/videoService.ts', './src/services/uploadService.ts', './src/services/sportsService.ts', './src/services/liveTvService.ts', './src/services/commentService.ts', './src/services/careerService.ts', './src/services/advertisementService.ts'],
          'hooks': ['./src/hooks/useAuth.tsx', './src/hooks/use-toast.ts', './src/hooks/use-mobile.tsx', './src/hooks/useLocalStorage.ts'],
          'utils': ['./src/lib/utils.ts', './src/lib/api-client.ts', './src/lib/api.ts', './src/utils/api-helper.ts', './src/utils/authGuard.ts', './src/utils/sitemapGenerator.js'],
        },
        
        // Asset file naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
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
  },
}));