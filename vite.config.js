import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const hfToken = env.VITE_HF_TOKEN;

  return {
    server: {
      proxy: {
        "/api/chat": {
          target: "https://router.huggingface.co/together/v1",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/chat/, "/chat/completions"),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (hfToken) {
                proxyReq.setHeader("Authorization", `Bearer ${hfToken}`);
              }
            });
          },
        },
        "/api/image": {
          target: "https://router.huggingface.co/nscale/v1",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/image/, "/images/generations"),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (hfToken) {
                proxyReq.setHeader("Authorization", `Bearer ${hfToken}`);
              }
            });
          },
        },
      },
    },
  };
});
