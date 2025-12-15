import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { apiPrefix } from "./src/shared/config/routes.config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:9999";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@hex/shared": fileURLToPath(new URL("../shared/src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        [apiPrefix]: {
          target: backendUrl,
          changeOrigin: true,
        },
        "/socket.io": {
          target: backendUrl,
          ws: true,
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
    },
  };
});
