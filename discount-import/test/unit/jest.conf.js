// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const path = require('node:path')

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
  coverageReporters: ['text', 'json-summary', 'lcov'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/test/**',
    '!**/node_modules/**',
    // a local CLI entrypoint: DB, network and argv glue, like server.js. Its
    // parsing logic lives in scripts/lidlVolume.js and is tested; the runner
    // itself is exercised by hand against a real store dump.
    '!scripts/lidl-selfscan.js'
  ]
}
