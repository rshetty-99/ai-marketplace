import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: Static export removed to support Clerk authentication
  
  // Image optimization
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Build optimizations
  productionBrowserSourceMaps: false,
  
  // Security headers
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.dev https://clerk.accounts.dev https://clerk.dev",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://www.google-analytics.com https://*.firebase.com https://*.googleapis.com https://images.unsplash.com https://img.clerk.com https://*.clerk.com",
      "connect-src 'self' https://api.clerk.dev https://*.clerk.accounts.dev https://*.clerk.dev https://clerk.accounts.dev https://clerk.dev https://clerk-telemetry.com https://*.googleapis.com https://www.google-analytics.com https://api.stripe.com wss://*.googleapis.com",
      "frame-src 'self' https://clerk.dev https://*.clerk.accounts.dev https://*.clerk.dev https://clerk.accounts.dev https://js.stripe.com https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      isDevelopment ? "" : "upgrade-insecure-requests"
    ].filter(Boolean).join("; ");

    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          },
          {
            key: 'Content-Security-Policy',
            value: csp
          },
          // HSTS (only for HTTPS)
          ...(isDevelopment ? [] : [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }]),
          // Performance headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS || '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          }
        ]
      }
    ];
  },

  // Redirect configuration
  async redirects() {
    return [
      // Redirect /login to /auth/sign-in
      {
        source: '/login',
        destination: '/auth/sign-in',
        permanent: true
      },
      // Redirect /register to /auth/sign-up
      {
        source: '/register',
        destination: '/auth/sign-up',
        permanent: true
      },
      // Redirect old URLs
      {
        source: '/services',
        destination: '/browse',
        permanent: true
      }
    ];
  },

  // Rewrite configuration
  async rewrites() {
    return [
      // Health check endpoint
      {
        source: '/health',
        destination: '/api/health'
      },
      // Version endpoint
      {
        source: '/version',
        destination: '/api/version'
      },
      // Sitemap
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap'
      },
      // Robots.txt
      {
        source: '/robots.txt',
        destination: '/api/robots'
      }
    ];
  },

  // Environment variables to expose to the client
  env: {
    CUSTOM_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    BUILD_TIME: new Date().toISOString(),
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
          openAnalyzer: false,
        })
      );
    }

    // Optimize bundle
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            enforce: true,
          },
          firebase: {
            test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            name: 'firebase',
            chunks: 'all',
            enforce: true,
          },
          clerk: {
            test: /[\\/]node_modules[\\/]@clerk[\\/]/,
            name: 'clerk',
            chunks: 'all',
            enforce: true,
          },
        },
      },
    };

    // Add fallbacks for node modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    return config;
  },

  // External packages for server components (moved from experimental)
  serverExternalPackages: ['firebase-admin'],

  // Experimental features
  experimental: {
    // Performance improvements
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    // Note: webpackBuildWorker removed for compatibility
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Static file serving
  assetPrefix: process.env.CDN_URL || '',
  
  // Internationalization (if needed in the future)
  // i18n: {
  //   locales: ['en', 'es', 'fr'],
  //   defaultLocale: 'en',
  // },
};

export default nextConfig;
