/**
 * useSegmentation — 人像背景分割
 *
 * 调用后端 /api/segment 接口，后端使用 remove.bg API 进行专业抠图。
 * remove.bg 是业界质量标杆，专为人像设计，发丝/边缘细节极佳。
 *
 * 返回值：带透明通道的 HTMLImageElement（PNG，分辨率与原图相同）
 *
 * 后端需配置环境变量 REMOVE_BG_API_KEY（申请：https://www.remove.bg/api）
 */
import { ref } from 'vue'

export function useSegmentation() {
  const isReady = ref(true)   // 无需预加载，接口即用
  const error = ref(null)

  async function ensureReady() {
    isReady.value = true
  }

  /**
   * 对照片执行人像分割，返回透明背景的人像图片
   * @param {string} photoDataUrl - 原始照片 base64 dataURL
   * @returns {Promise<HTMLImageElement>} 带透明通道的人像图片（PNG）
   */
  async function segment(photoDataUrl) {
    const response = await fetch('/api/segment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: photoDataUrl })
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || `抠图请求失败（${response.status}）`)
    }

    const { image } = await response.json()

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('透明人像图片加载失败'))
      img.src = image
    })
  }

  return { isReady, error, ensureReady, segment }
}
