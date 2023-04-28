// Docs: https://eslint.org/docs/user-guide/configuring
module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    es6: true,
    ecmaVersion: 6,
    sourceType: "module",
    jsx: false,
    requireConfigFile: false,
  },
  rules: {
    "no-unused-vars": 2, // 0 = ignore, 1 = warn, 2= error
  },
  env: {
    browser: true,
    node: true,
  },
  extends: ["airbnb-base", "prettier"],
};
