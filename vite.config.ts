import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false, // use the existing site.webmanifest in public/
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,md,woff,woff2}"],
        // Serve the cached app shell for any navigation request when offline.
        // Without this the service worker throws "FetchEvent.respondWith received
        // an error" because it intercepts the request but has nothing to return.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
