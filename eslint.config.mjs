/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
// eslint.config.mjs
import next from "eslint-config-next";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

const config = [
  // Global ignores for generated / tooling output. `eslint-config-next`
  // already ignores `.next/**`, `out/**`, `build/**`, and `next-env.d.ts`;
  // these are the test/coverage outputs it does not cover. Without this,
  // `eslint .` non-deterministically lints generated files (e.g. istanbul's
  // `coverage/**/*.js` report helpers trip `--max-warnings=0`).
  {
    ignores: [
      "coverage/**",
      "dist/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },

  // Next.js defaults (React, React Hooks, jsx-a11y, import, @next/next,
  // and the @typescript-eslint plugin/parser wiring).
  ...next,

  // Stricter, mostly type-aware rules for the application TypeScript sources.
  {
    name: "selfhelp/strict-typescript",
    files: ["**/*.{ts,tsx}"],
    plugins: {
      // Same plugin object eslint-config-next already registers, so this is a
      // safe re-declaration (identical reference) and lets us add rules here.
      "@typescript-eslint": tseslint.plugin,
      "unused-imports": unusedImports,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // Type-aware linting (no-floating-promises, no-misused-promises,
        // no-unnecessary-type-assertion). projectService transparently
        // provides a default program for any file not covered by tsconfig.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // --- Unused imports / variables ---
      // unused-imports owns this concern; the TS rule is disabled to avoid
      // duplicate reports.
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // --- Type safety ---
      // `no-explicit-any` is an ERROR: the application sources were cleaned of
      // explicit `any` during this lint pass, so the rule now guards against
      // regressions. New `any` must be replaced with a precise type, an
      // existing project type, generics, or `unknown` (only when that does not
      // change runtime behavior). The single unavoidable site keeps a narrow,
      // documented `// eslint-disable-next-line` (see
      // `src/types/common/styles.types.ts`).
      "@typescript-eslint/no-explicit-any": "error",
      // `no-unnecessary-type-assertion` is intentionally OFF. Its type-aware
      // analysis disagrees with `tsc` for some DOM overloads (e.g. it treats
      // `el.querySelector('input[name=...]') as HTMLInputElement` as
      // redundant), so its auto-fix removes genuinely-necessary assertions and
      // breaks the build. Leaving it off avoids a `lint:fix` that corrupts
      // types; re-enable only if the type program is verified consistent with
      // the project's `tsc`.
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // --- Promise safety (type-aware) ---
      "@typescript-eslint/no-floating-promises": "error",
      // `attributes: false` allows async functions as JSX event handler
      // attributes (e.g. onClick={async () => ...}); React ignores the
      // returned promise, so this is a valid pattern, not a misuse. All other
      // void-return contexts (arguments, properties, returns) stay checked.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],

      // --- General correctness ---
      "consistent-return": "error",
      "no-unreachable": "error",
      "no-duplicate-imports": "error",
      "no-debugger": "error",
      // console.warn / console.error stay allowed; other console.* surface as
      // warnings (non-blocking) so intentional logging is visible but reviewed.
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
];

export default config;
