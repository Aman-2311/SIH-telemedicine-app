export default [
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-use-before-define": ["error", { variables: true, functions: false, classes: true }]
    }
  }
];
