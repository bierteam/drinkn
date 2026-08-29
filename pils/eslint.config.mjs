import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'

// Replaces `standard`. The style rules below are configured to match what
// standard enforced, so existing files keep their shape: two-space indent,
// single quotes, no semicolons, no trailing commas, and a space before
// function parentheses.
export default [
  {
    ignores: ['node_modules/**', 'test/unit/coverage/**']
  },

  js.configs.recommended,

  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: false,
    commaDangle: 'never',
    braceStyle: '1tbs',
    quoteProps: 'as-needed',
    arrowParens: false,
    jsx: false
  }),

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      // this service is CommonJS: require() and module.exports throughout
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    rules: {
      // two places where @stylistic's defaults disagree with the style the
      // existing code was written in under standard
      '@stylistic/space-before-function-paren': ['error', 'always'],
      '@stylistic/arrow-parens': ['error', 'as-needed']
    }
  },

  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      }
    }
  }
]
