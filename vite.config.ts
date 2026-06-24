// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  nitro: {
    // Dynamically choose preset based on environment, default to cloudflare-pages
    preset: process.env.VERCEL
      ? "vercel"
      : process.env.NETLIFY
      ? "netlify"
      : process.env.NITRO_PRESET || "cloudflare-pages",
    // Enable pre-rendering to generate static HTML files for cPanel/Amingo.me
    prerender: {
      crawlLinks: true,
      routes: ["/"],
    },
  } as any,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    base: "./",
    build: {
      chunkSizeWarningLimit: 2000,
    },
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "AssignHub",
          short_name: "AssignHub",
          description: "Assignment Management Platform",
          theme_color: "#3B82F6",
          background_color: "#FFFFFF",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          icons: [
            {
              src: "/logo-192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "/logo-512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ]
        }
      })
    ]
  },
});
