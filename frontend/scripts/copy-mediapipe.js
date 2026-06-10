/**
 * 将 MediaPipe WASM 运行时文件从 node_modules 复制到 public/mediapipe
 * 使 Vite 开发服务器和生产构建均可直接访问这些静态文件
 */
import { cpSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'node_modules', '@mediapipe', 'selfie_segmentation')
const DEST = join(ROOT, 'public', 'mediapipe')

if (!existsSync(SRC)) {
  console.warn('[copy-mediapipe] @mediapipe/selfie_segmentation 未找到，跳过复制')
  process.exit(0)
}

mkdirSync(DEST, { recursive: true })

const FILES = [
  'selfie_segmentation.js',
  'selfie_segmentation.binarypb',
  'selfie_segmentation.tflite',
  'selfie_segmentation_landscape.tflite',
  'selfie_segmentation_solution_simd_wasm_bin.js',
  'selfie_segmentation_solution_simd_wasm_bin.wasm',
  'selfie_segmentation_solution_simd_wasm_bin.data',
  'selfie_segmentation_solution_wasm_bin.js',
  'selfie_segmentation_solution_wasm_bin.wasm'
]

FILES.forEach((file) => {
  const src = join(SRC, file)
  const dest = join(DEST, file)
  if (existsSync(src)) {
    cpSync(src, dest)
  }
})

console.log('[copy-mediapipe] MediaPipe 运行时文件已复制到 public/mediapipe/')
