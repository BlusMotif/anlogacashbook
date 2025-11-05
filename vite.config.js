import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// ✅ This version ensures _redirects and 404.html get copied and React Router routes work on Render
export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-spa-files",
      closeBundle() {
        const filesToCopy = ["_redirects", "404.html"];
        filesToCopy.forEach(file => {
          const src = path.resolve(__dirname, `public/${file}`);
          const dest = path.resolve(__dirname, `dist/${file}`);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`✅ Copied ${file} to dist/`);
          } else {
            console.warn(`⚠️  No ${file} file found in /public folder`);
          }
        });
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