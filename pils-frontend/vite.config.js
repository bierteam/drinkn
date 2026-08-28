import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    extensions: [
      '.js',
      '.vue'
    ]
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000'
      }
    }
  },
  plugins: [
    vue()
  ],
  build: {
    rollupOptions: {}
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      // without this only files a test imported are counted, which quietly
      // leaves every untested component out of the percentage
      all: true,
      include: ['src/**/*.{js,vue}'],
      exclude: ['src/**/*.test.js', 'src/main.js'],
      reporter: ['text', 'json-summary', 'lcov']
    }
  }
})
