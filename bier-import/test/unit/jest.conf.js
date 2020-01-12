// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const path = require('path')

module.exports = {
  rootDir: path.resolve(__dirname, '../../'),
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json'],
  clearMocks: true,
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    '<rootDir>/test/e2e',
    '/node_modules/'
  ],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/test/unit/coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/test/**',
    '!**/node_modules/**'
  ]
}
