import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

const importOrderRules = [
  "error",
  {
    "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
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
];

export default [
  {
    ignores: ["dist/**", "public/**", "node_modules/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/order": importOrderRules,
      "sort-imports": [
        "error",
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          allowSeparatedGroups: true,
        },
      ],
    },
  },
];
