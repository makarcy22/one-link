import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds the clickable preview: pretend server inside the page, one JS file, one CSS file.
export default defineConfig({
  plugins: [react()],
  base: "./",
  define: { "import.meta.env.VITE_MOCK_API": JSON.stringify("true") },
  build: {
    outDir: "dist-preview",
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true, entryFileNames: "app.js", assetFileNames: "app.[ext]" } },
  },
});
