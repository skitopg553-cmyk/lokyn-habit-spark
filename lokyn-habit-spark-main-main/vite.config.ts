import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.jpg", "pwa-192x192.jpg", "pwa-512x512.jpg"],
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      manifest: {
        name: "LOKYN",
        short_name: "LOKYN",
        description: "Ton compagnon de discipline quotidienne",
        start_url: "/",
        display: "standalone",
        background_color: "#0D0D0F",
        theme_color: "#FF6B2B",
        orientation: "portrait",
        icons: [
          {
            src: "/pwa-192x192.jpg",
            sizes: "192x192",
            type: "image/jpeg",
          },
          {
            src: "/pwa-512x512.jpg",
            sizes: "512x512",
            type: "image/jpeg",
          },
          {
            src: "/pwa-512x512.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
