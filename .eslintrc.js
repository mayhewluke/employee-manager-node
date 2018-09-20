module.exports = {
  extends: ["airbnb", "prettier"],
  plugins: ["prettier"],
  parser: "babel-eslint",
  rules: {
    strict: 0,
    "prettier/prettier": "error"
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "typescript-eslint-parser",
      rules: {
        // ESLint can't check paths for TypeScript files, and TypeScript will check
        // that anyway
        "import/no-unresolved": "off",
        // ESLint sees type-level declarations as variable declarations and thinks
        // the variables are undefined or unused. Disable checking the following,
        // since TypeScript will check anyway
        "no-undef": "off",
        "no-unused-vars": "off",
        "no-use-before-define": "off"
      }
    }
  ]
};
