const { ESLint } = require("eslint");

(async function main() {
  const eslint = new ESLint({
    useEslintrc: false,
    overrideConfig: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      rules: {
        "no-use-before-define": ["error", { variables: true, functions: false, classes: true }],
      },
    },
  });

  const results = await eslint.lintFiles(["../dist/public/assets/index-B_yI3cUH.js"]);
  const formatter = await eslint.loadFormatter("stylish");
  const resultText = formatter.format(results);
  
  const fs = require('fs');
  fs.writeFileSync('eslint_output.txt', resultText);
  console.log("ESLint finished. Found " + results[0].errorCount + " errors.");
})().catch(console.error);
