import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { compression } from "vite-plugin-compression2";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { defineConfig, loadEnv, createLogger } from "vite";

export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), "");
  const isProduction = mode === "production";
  const isDevelopment = mode === "development";
  const enableAnalyzer = env.VITE_ENABLE_BUNDLE_ANALYZER === "true";

  return {
    // ============================================
    // Plugins
    // ============================================
    plugins: [
      // React plugin with optimized settings
      react({
        // Use automatic JSX runtime
        jsxRuntime: "automatic",
      }),

      // Tailwind CSS
      tailwindcss(),

      // Image optimization
      ViteImageOptimizer({
        include: /\.(jpe?g|png|webp|gif)$/i,
        test: /\.(jpe?g|png|webp|gif)$/i,
        exclude: "node_modules/**",
        logStats: isDevelopment,
        ansiColors: true,
        png: {
          quality: 80,
        },
        jpeg: {
          quality: 80,
        },
        webp: {
          lossless: true,
        },
      }),

      // Gzip and Brotli compression
      compression({
        algorithms: ["gzip"],
        threshold: 1024,
        deleteOriginalAssets: false,
        skipIfLargerOrEqual: true,
      }),

      compression({
        algorithms: ["brotliCompress"],
        threshold: 1024,
        deleteOriginalAssets: false,
        skipIfLargerOrEqual: true,
      }),

      // PWA support
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
        manifest: {
          name: "VoTex - Digital Voting Platform",
          short_name: "VoTex",
          description: "Secure Digital Democracy Platform",
          theme_color: "#0f172a",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait-primary",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "/icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: "CacheFirst",
              options: {
                cacheName: "images-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
      }),

      // Bundle analyzer (only when enabled)
      enableAnalyzer &&
        visualizer({
          open: true,
          filename: "dist/stats.html",
          gzipSize: true,
          brotliSize: true,
          template: "treemap",
        }),
    ].filter(Boolean),

    // ============================================
    // Path Resolution
    // ============================================
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@services": path.resolve(__dirname, "./src/services"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@types": path.resolve(__dirname, "./src/types"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@styles": path.resolve(__dirname, "./src/styles"),
        "@db": path.resolve(__dirname, "./src/db"),
        "@api": path.resolve(__dirname, "./src/api"),
        "@middleware": path.resolve(__dirname, "./src/middleware"),
        "@validators": path.resolve(__dirname, "./src/validators"),
        "@context": path.resolve(__dirname, "./src/context"),
        "@layouts": path.resolve(__dirname, "./src/layouts"),
        "@shared": path.resolve(__dirname, "./src/shared"),
      },

      // File extensions to resolve
      extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json", ".css"],
    },

    // ============================================
    // Build Configuration
    // ============================================
    build: {
      // Output directory
      outDir: "dist",

      // Enable/disable source maps
      sourcemap: isDevelopment ? "inline" : "hidden",

      // Minification options
      minify: isProduction ? "terser" : false,

      // Terser options for production
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ["console.log", "console.info", "console.debug"],
              passes: 2,
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          }
        : undefined,

      // CSS handling
      cssMinify: isProduction ? "lightningcss" : false,
      cssCodeSplit: true,

      // Target browsers
      target: "es2020",

      // Module preloading
      modulePreload: {
        polyfill: true,
        resolveDependencies: (filename, deps) => {
          // Exclude certain dependencies from preloading
          return deps.filter((dep) => !dep.includes("tensorflow"));
        },
      },

      // Chunk size warning
      chunkSizeWarningLimit: 1000,

      // Rollup options
      rollupOptions: {
        output: {
          // Manual chunk splitting
          manualChunks: (id) => {
            // Node modules
            if (id.includes("node_modules")) {
              // React ecosystem
              if (
                id.includes("/node_modules/react/") ||
                id.includes("/node_modules/react-dom/") ||
                id.includes("/node_modules/react-router/") ||
                id.includes("/node_modules/scheduler/")
              ) {
                return "vendor-react";
              }

              // TensorFlow (large dependency)
              if (
                id.includes("@tensorflow") ||
                id.includes("@vladmandic/face-api") ||
                id.includes("face-landmarks-detection")
              ) {
                return "vendor-tensorflow";
              }

              // UI libraries
              if (
                id.includes("lucide-react") ||
                id.includes("framer-motion") ||
                id.includes("@headlessui") ||
                id.includes("@radix-ui")
              ) {
                return "vendor-ui";
              }

              // Form handling
              if (id.includes("zod") || id.includes("react-hook-form")) {
                return "vendor-forms";
              }

              // Chart/visualization
              if (id.includes("recharts") || id.includes("d3")) {
                return "vendor-charts";
              }
            }

            // App code splitting
            if (id.includes("/pages/")) {
              const pageName = id.split("/pages/")[1].split("/")[0];
              return `page-${pageName}`;
            }

            if (id.includes("/components/face-verification/")) {
              return "face-verification";
            }
          },

          // Chunk naming
          chunkFileNames: isProduction
            ? "assets/js/[name].[hash:10].js"
            : "assets/js/[name].js",
          entryFileNames: isProduction
            ? "assets/js/[name].[hash:10].js"
            : "assets/js/[name].js",
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split(".") || [];
            const ext = info[info.length - 1];

            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || "")) {
              return `assets/images/[name].[hash:10].[ext]`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || "")) {
              return `assets/fonts/[name].[hash:10].[ext]`;
            }
            if (/\.css$/i.test(assetInfo.name || "")) {
              return `assets/css/[name].[hash:10].[ext]`;
            }

            return `assets/[name].[hash:10].[ext]`;
          },
        },

        // External dependencies (keep as external)
        external: [],
      },

      // Asset inlining threshold
      assetsInlineLimit: 4096, // 4KB
    },

    // ============================================
    // CSS Configuration
    // ============================================
    css: {
      // CSS modules
      modules: {
        localsConvention: "camelCaseOnly",
        scopeBehaviour: "local",
        generateScopedName: isProduction
          ? "[hash:base64:8]"
          : "[name]__[local]__[hash:base64:5]",
      },

      // Preprocessor options
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@styles/variables";`,
        },
      },

      // Dev sourcemap
      devSourcemap: isDevelopment,
    },

    // ============================================
    // Development Server
    // ============================================
    server: {
      // Port
      port: parseInt(env.VITE_PORT || env.PORT || "3000"),

      // Strict port
      strictPort: false,

      // Auto-open browser
      open: env.VITE_OPEN_BROWSER === "true",

      // HMR
      hmr:
        env.VITE_DISABLE_HMR === "true"
          ? false
          : {
              overlay: true,
              ...(env.VITE_HMR_PROTOCOL
                ? { protocol: env.VITE_HMR_PROTOCOL as "ws" | "wss" }
                : {}),
              ...(env.VITE_HMR_HOST ? { host: env.VITE_HMR_HOST } : {}),
              ...(env.VITE_HMR_PORT
                ? { port: parseInt(env.VITE_HMR_PORT, 10) }
                : {}),
              ...(env.VITE_HMR_CLIENT_PORT
                ? { clientPort: parseInt(env.VITE_HMR_CLIENT_PORT, 10) }
                : {}),
            },
      watch: {
        ignored: [
          "**/node_modules/**",
          "**/.vs/**",
          "**/.git/**",
          "**/src/db/data/**",
          "**/dist/**",
          "**/*.json",
          "**/*.md",
        ],
        usePolling: env.VITE_USE_POLLING === "true",
        interval: 1000,
      },

      // Proxy configuration
      proxy: {
        "/api": {
          target:
            env.VITE_API_URL ||
            env.VITE_API_BASE_URL ||
            "http://localhost:3000",
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.log("Proxy error:", err);
            });
            proxy.on("proxyReq", (proxyReq, req) => {
              console.log("Proxying:", req.method, req.url);
            });
          },
        },
        "/socket.io": {
          target: env.VITE_WS_URL || "ws://localhost:3000",
          ws: true,
        },
      },

      // CORS
      cors: {
        origin: env.VITE_CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
      },

      // Headers
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(self), microphone=()",
      },
    },

    // ============================================
    // Preview Server (for production builds)
    // ============================================
    preview: {
      port: parseInt(env.VITE_PREVIEW_PORT || "4173"),
      strictPort: true,
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.votex.gov;",
      },
    },

    // ============================================
    // Environment Variables
    // ============================================
    envPrefix: "VITE_",

    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || "1.0.0"),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      __API_URL__: JSON.stringify(env.VITE_API_URL || "/api"),
      __ENABLE_ANALYTICS__: JSON.stringify(
        env.VITE_ENABLE_ANALYTICS === "true",
      ),
    },

    // ============================================
    // ESBuild Options
    // ============================================
    esbuild: {
      // Drop console in production
      drop: isProduction ? ["console", "debugger"] : [],

      // Keep names for debugging in development
      keepNames: isDevelopment,

      // JSX configuration
      jsx: "automatic",
      jsxImportSource: "react",
    },

    // ============================================
    // Optimization
    // ============================================
    optimizeDeps: {
      // Force include these dependencies
      include: [
        "react",
        "react-dom",
        "zod",
        "@tensorflow/tfjs-core",
        "@tensorflow/tfjs-backend-webgl",
        "@tensorflow-models/face-landmarks-detection",
      ],

      // Exclude from optimization
      exclude: ["@tensorflow/tfjs-node"],

      // ESBuild options for dependency optimization
      esbuildOptions: {
        target: "es2020",
        supported: {
          bigint: true,
        },
      },
    },

    // ============================================
    // Worker Configuration
    // ============================================
    worker: {
      format: "es",
      plugins: () => [react()],
    },



    // ============================================
    // Log Level
    // ============================================
    logLevel: isProduction ? "warn" : "info",

    // Clear screen on rebuild
    clearScreen: isDevelopment,

    // Custom logger
    customLogger: createLogger(isProduction ? "warn" : "info", {
      prefix: "[VoTEx]",
    }),
  };
});
