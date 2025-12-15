import { createRequire } from "node:module";

const requireFromFrontend = createRequire(
  new URL("../frontend/package.json", import.meta.url),
);

const importPlugin = requireFromFrontend("eslint-plugin-import");
const tseslint = requireFromFrontend("typescript-eslint");

const importOrderRules = [
  "error",
  {
    groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
    pathGroupsExcludedImportTypes: [],
    "newlines-between": "never",
    alphabetize: { order: "asc", caseInsensitive: true },
  },
];

export default [
  {
    ignores: ["dist/**", "data/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.ts", "test/**/*.ts", "*.ts"],
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

