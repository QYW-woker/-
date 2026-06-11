import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import mkcert from 'vite-plugin-mkcert'
import path from 'path'

export default defineConfig(({ command }) => ({
  plugins: [
    vue(),
    // mkcert 仅用于本地 dev 的 HTTPS（手机局域网访问摄像头）。
    // 生产构建（vite build，如 Render）不需要，且它会尝试下载二进制/改信任库导致构建失败。
    ...(command === 'serve' ? [mkcert()] : [])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    // 排除运行时加载 WASM/Worker 的库，防止 Vite 预构建破坏动态导入
    exclude: ['@mediapipe/selfie_segmentation', '@imgly/background-removal']
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'https://localhost:4000',
        changeOrigin: true,
        secure: false   // 后端是自签名 HTTPS 证书，跳过校验
      }
    }
  }
}))
