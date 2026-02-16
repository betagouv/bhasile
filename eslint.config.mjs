import { FlatCompat } from "@eslint/eslintrc";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "scripts/one-off-scripts/**",
      "src/generated/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message:
                "L'import de @prisma/client est interdit en dehors de src/app/api/, lib/ ou prisma/.",
            },
            {
              name: "@/generated/prisma/client",
              message:
                "L'import de @/generated/prisma/client est interdit en dehors de src/app/api/, lib/ ou prisma/.",
            },
          ],
        },
      ],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "curly": ["warn", "all"],
    },
  },
  {
    files: [
      "src/app/api/**/*.{js,ts,jsx,tsx}",
      "src/lib/**/*.{js,ts,jsx,tsx}",
      "lib/**/*.{js,ts,jsx,tsx}",
      "prisma/**/*.{js,ts,jsx,tsx}",
      "scripts/**/*.{js,ts,jsx,tsx}",
      "src/types/**/*.{js,ts,jsx,tsx}",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
];

export default eslintConfig;
