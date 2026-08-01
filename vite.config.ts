import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate React libraries
            react: ["react", "react-dom"],

            // Separate TensorFlow (large dependency)
            tensorflow: [
              "@tensorflow-models/face-landmarks-detection",
              "@tensorflow/tfjs-backend-webgl",
            ],
          },
        },
      },

      // Optional: only controls the warning threshold
      chunkSizeWarningLimit: 1000,
    },

    server: {
      hmr: process.env.DISABLE_HMR !== "true",

      watch:
        process.env.DISABLE_HMR === "true"
          ? null
          : {
              ignored: ["**/src/db/data/**", "**/src/db/data/*.json"],
            },
    },
  };
});
