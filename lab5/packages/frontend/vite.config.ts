import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { API_PREFIX } from "./src/shared/config/routes.config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@hex/shared": fileURLToPath(new URL("../shared/src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      [API_PREFIX]: {
        target: "http://localhost:9999",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
});
