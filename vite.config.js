import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// ✅ This version ensures _redirects gets copied and React Router routes work on Render
export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-redirects",
      closeBundle() {
        const src = path.resolve(__dirname, "public/_redirects");
        const dest = path.resolve(__dirname, "dist/_redirects");
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log("✅ Copied _redirects to dist/");
        } else {
          console.warn("⚠️  No _redirects file found in /public folder");
        }
      },
    },
  ],
  publicDir: "public",
  build: {
    outDir: "dist",
  },
  server: {
    historyApiFallback: true, // Helps when running locally with vite preview
  },
});