import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target:
          "https://script.google.com/macros/s/AKfycby2WxKUWyB73KV1n2Idiy487WDYojwKD2u1SZeH6x4JzwOgVSSKEiDlFKl8BXU9bx4MpQ/exec",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: false,
      },
    },
  },
});
