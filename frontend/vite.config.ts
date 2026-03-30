import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api/comfyui": {
        target: "http://127.0.0.1:8188",
        rewrite: (path) => path.replace(/^\/api\/comfyui/, ""),
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("referer");
          });
        },
      },
      "/api/comfyui-ws": {
        target: "ws://127.0.0.1:8188",
        ws: true,
        rewrite: (path) => path.replace(/^\/api\/comfyui-ws/, ""),
        changeOrigin: true,
      },
      "/api/enhancer": {
        target: "http://127.0.0.1:8189",
        rewrite: (path) => path.replace(/^\/api\/enhancer/, ""),
        changeOrigin: true,
      },
    },
  },
  publicDir: "public",
});
