const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  {
    files: ["app/**/*.ts", "app/**/*.tsx", "src/**/*.ts", "src/**/*.tsx"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    ignores: ["dist/*"],
  },
);
