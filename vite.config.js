import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const hfToken = env.VITE_HF_TOKEN;

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/chat": {
          target: "https://router.huggingface.co/together/v1/chat/completions",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/chat/, ""),
          headers: {
            Authorization: `Bearer ${hfToken}`,
          },
        },
        "/api/image": {
          target: "https://router.huggingface.co/nscale/v1/images/generations",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/image/, ""),
          headers: {
            Authorization: `Bearer ${hfToken}`,
          },
        },
      },
    },
  };
});
