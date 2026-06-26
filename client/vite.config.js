import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
    preview: {
    allowedHosts: ['sunny-luck-production-b1f0.up.railway.app'],
    host: '0.0.0.0',
    port: 8080,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — cached separately, changes rarely
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Recharts is ~1.2 MiB; keep it in its own lazy chunk
          "vendor-recharts": ["recharts"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
