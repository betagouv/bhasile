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
    env: {
      NEXT_PUBLIC_DOCUMENTS_FINANCIERS_OPEN_YEAR: "2025",
      NEXT_PUBLIC_INDICATEUR_FINANCIER_CUTOFF_YEAR_AUTORISEE: "2024",
      NEXT_PUBLIC_INDICATEUR_FINANCIER_CUTOFF_YEAR_SUBVENTIONNEE: "2024",
      NEXT_PUBLIC_AUTORISEE_OPEN_YEAR: "2025",
      NEXT_PUBLIC_SUBVENTIONNEE_OPEN_YEAR: "2024",
    },
    sequence: { shuffle: true },
    setupFiles: ["./setupTests.js"],
    exclude: [
      "**/tests/e2e/**",
      "**/tests/e2e-legacy/**",
      "**/node_modules/**",
    ],
    testTimeout: 10000,
  },
});
