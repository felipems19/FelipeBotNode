/* eslint-disable */
module.exports = {
  env: {
    commonjs: true,
    node: true,
    mocha: true,
  },
  extends: ['airbnb-base', 'prettier'],
  plugins: ['jsdoc', 'prettier'],
  rules: {
    'jsdoc/no-undefined-types': 1,
    'class-methods-use-this': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
    'no-param-reassign': 'off',
  },
}
