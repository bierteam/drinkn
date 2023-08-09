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
      "/api": {
        target: "http://localhost:3000"
      },
    },
  },
  plugins: [
    vue()
  ],
  build: {
    rollupOptions: {}
  }
})
