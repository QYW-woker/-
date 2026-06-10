import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE || '/api'

/**
 * 将 base64 图片上传到后端
 * @param {string} dataUrl - image/jpeg base64 data URL
 * @returns {Promise<{id: string, url: string, expiresAt: string}>}
 */
export async function uploadImage(dataUrl) {
  // base64 → Blob
  const res = await fetch(dataUrl)
  const blob = await res.blob()

  const formData = new FormData()
  formData.append('image', blob, 'photo.jpg')

  const response = await axios.post(`${BASE}/image/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000
  })

  if (!response.data.success) {
    throw new Error(response.data.message || '上传失败')
  }

  // 使用后端返回的 url：
  //   本地开发：后端用 getLocalIP() 生成 http://192.168.x.x:4000/api/image/:id（HTTP，无证书问题）
  //   生产部署：后端读取 PUBLIC_URL 环境变量生成正确的域名 URL
  // ⚠️  生产服务器必须在 backend/.env 中设置 PUBLIC_URL=https://yourdomain.com
  return response.data.data
}
