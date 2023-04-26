/* eslint-disable */
module.exports = {
  env: {
    commonjs: true,
    node: true,
    mocha: true,
  },
  extends: ['airbnb-base', 'eslint:recommended', 'plugin:prettier/recommended'],
  plugins: ['jsdoc', 'prettier'],
  rules: {
    'jsdoc/no-undefined-types': 1,
    'class-methods-use-this': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
    'no-param-reassign': 'off',
    'prettier/prettier': 'error',
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module',
    requireConfigFile: false,
    ecmaVersion: 'latest',
  },
  ignorePatterns: ['node_modules'],
}
