import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  server: {
    open: true,
  },
  resolve: {
    alias: {
      "@js": path.resolve(__dirname, "./js"), // Maps `@js` to the `js` folder
    },
  },
});
