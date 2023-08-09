import { defineConfig } from 'vite'
import path from 'path'
import { createVuePlugin as vue } from 'vite-plugin-vue2'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      }
    ],
    extensions: [
      '.js',
      '.vue'
    ]
  },
  plugins: [
    vue()
  ],
  build: {
    rollupOptions: {}
  }
})
