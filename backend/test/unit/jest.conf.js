// Mirrors beer-import's config so both services report coverage the same way.
const path = require('node:path')

module.exports = {
  rootDir: path.resolve(__dirname, '../../'),
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json'],
  clearMocks: true,
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/test/unit/coverage',
  coverageReporters: ['text', 'json-summary', 'lcov'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/test/**',
    '!**/node_modules/**'
  ]
}
