import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    build: {
      rollupOptions: {
        input: { main: "index.html" }
      }
    },
    plugins: [
      {
        name: "html-env-replace",
        transformIndexHtml(html) {
          return html
            .replace(/%VITE_SUPABASE_URL%/g, env.VITE_SUPABASE_URL || "")
            .replace(/%VITE_SUPABASE_KEY%/g, env.VITE_SUPABASE_KEY || "");
        }
      }
    ]
  };
});