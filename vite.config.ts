import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^@surface$/,
        replacement: resolve(import.meta.dirname, "./surface/index.ts"),
      },
      {
        find: /^@surface\//,
        replacement: resolve(import.meta.dirname, "./surface") + "/",
      },
      {
        find: /^@\//,
        replacement: resolve(import.meta.dirname, "./src") + "/",
      },
    ],
  },
})
