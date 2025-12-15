import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "public/**",
      "node_modules/**",
      "vite.config.ts",
      "eslint.config.mjs",
    ],
  },
  js.configs.recommended,
  {
    extends: [...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "import": importPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooks,
    },
    settings: {
      "react": {
        version: "detect",
      },
      "import/resolver": {
        node: true,
      },
    },
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-props-no-spreading": "off",
      "react/function-component-definition": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { vars: "all", args: "after-used", ignoreRestSiblings: true },
      ],

      "import/order": [
        "error",
        {
          "groups": [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "pathGroups": [
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
            {
              pattern: "@/**",
              group: "internal",
              position: "before",
            },
          ],
          "pathGroupsExcludedImportTypes": ["react"],
          "newlines-between": "never",
          "alphabetize": { order: "asc", caseInsensitive: true },
        },
      ],
      // Let `import/order` sort declarations; this sorts named specifiers inside imports.
      "sort-imports": [
        "error",
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          allowSeparatedGroups: true,
        },
      ],

      "import/no-default-export": "error",

      "linebreak-style": "off",
      "padding-line-between-statements": [
        "warn",
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
        { blankLine: "always", prev: ["block-like"], next: "*" },
        { blankLine: "always", prev: ["function"], next: "*" },
      ],
    },
  }
);
