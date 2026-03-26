import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    sequence: { shuffle: true },
    setupFiles: ["./setupTests.js"],
    exclude: ["**/tests/e2e/**", "**/node_modules/**"],
    testTimeout: 10000,
  },
});
