// eslint.config.mjs
import next from "eslint-config-next";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  ...next, // use Next.js defaults
  {
    plugins: {
      "unused-imports": unusedImports
    },
    rules: {
      // Remove unused imports
      "unused-imports/no-unused-imports": "error",

      // Detect unused variables (but allow "_" prefix)
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_"
        }
      ],

      // Disable conflicting TS rule
      "@typescript-eslint/no-unused-vars": "off"
    }
  }
];
