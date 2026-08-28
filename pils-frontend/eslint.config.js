import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

// replaces `standard`, which only ever looked at .js files and so left every
// .vue file in src/ unchecked. the style rules below are configured to match
// what standard enforced, so existing .js files keep the same shape.
export default [
  {
    ignores: ['dist/**', 'node_modules/**']
  },

  js.configs.recommended,

  // parses <template> and <script> in .vue files
  ...pluginVue.configs['flat/essential'],

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
    files: ['**/*.js', '**/*.vue'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser
      }
    },
    rules: {
      // components here are deliberately named for the route they serve
      // (Home, Login, Discounts), so single-word names are the convention
      'vue/multi-word-component-names': 'off',

      // two places where @stylistic's defaults disagree with the style the
      // existing code was written in under standard
      '@stylistic/space-before-function-paren': ['error', 'always'],
      '@stylistic/arrow-parens': ['error', 'as-needed']
    }
  },

  {
    files: ['src/**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
]
