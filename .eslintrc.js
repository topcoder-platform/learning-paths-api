// Parse this untranspiled Node project without requiring a nonexistent Babel config.
module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: { requireConfigFile: false, babelOptions: { parserOpts: { allowReturnOutsideFunction: true } }, ecmaVersion: 'latest', sourceType: 'module' },
  env: { browser: true, node: true },
  rules: { 'no-unused-vars': 0 }
}
