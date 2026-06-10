/**
 * POST /api/segment
 * 服务端人像抠图：调用 remove.bg API，返回透明背景 PNG（base64）
 *
 * 环境变量：
 *   REMOVE_BG_API_KEY  — remove.bg API Key（必填，申请地址：https://www.remove.bg/api）
 *
 * 请求体（JSON）：
 *   { image: "data:image/jpeg;base64,..." }
 *
 * 响应（JSON）：
 *   { image: "data:image/png;base64,...", credits: "1" }
 *
 * 降级策略：
 *   1. 优先用 type=person（针对人像优化）
 *   2. 若返回 "Could not identify foreground"，自动用 type=auto 重试
 *   3. 两次均失败才返回错误
 */

const express = require('express')
const router = express.Router()
const axios = require('axios')
const FormData = require('form-data')

// "识别不到前景"时触发降级重试的关键词
const FOREGROUND_ERR = 'could not identify foreground'

/**
 * 调用一次 remove.bg API
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @param {string} apiKey
 * @param {string} type  'person' | 'auto'
 * @returns {Promise<{data: Buffer, credits: string}>}
 */
async function callRemoveBg(imageBuffer, mimeType, apiKey, type) {
  const form = new FormData()
  form.append('image_file', imageBuffer, {
    filename: 'photo.jpg',
    contentType: mimeType || 'image/jpeg'
  })
  form.append('size', 'auto')
  form.append('format', 'png')
  form.append('type', type)

  const response = await axios.post(
    'https://api.remove.bg/v1.0/removebg',
    form,
    {
      headers: { 'X-Api-Key': apiKey, ...form.getHeaders() },
      responseType: 'arraybuffer',
      timeout: 30000
    }
  )
  return {
    data: response.data,
    credits: response.headers['x-credits-charged'] || '?'
  }
}

/**
 * 解析 remove.bg 错误响应，返回可读字符串
 */
function parseRemoveBgError(errData) {
  try {
    const parsed = JSON.parse(Buffer.from(errData).toString('utf8'))
    return parsed.errors?.[0]?.title || '抠图失败'
  } catch {
    return '抠图失败'
  }
}

router.post('/', async (req, res) => {
  try {
    const { image } = req.body
    if (!image) return res.status(400).json({ error: '缺少 image 参数' })

    const apiKey = process.env.REMOVE_BG_API_KEY
    if (!apiKey) {
      return res.status(503).json({
        error: '抠图服务未配置，请在环境变量中设置 REMOVE_BG_API_KEY'
      })
    }

    const matches = image.match(/^data:(.+);base64,(.+)$/)
    if (!matches) return res.status(400).json({ error: '无效的图片格式' })

    const [, mimeType, base64Data] = matches
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // ── 第一次尝试：type=person（人像专项优化）────────────────
    console.log('[segment] 调用 remove.bg（type=person）...')
    let startTime = Date.now()

    try {
      const { data, credits } = await callRemoveBg(imageBuffer, mimeType, apiKey, 'person')
      console.log(`[segment] 完成，耗时 ${Date.now() - startTime}ms，积分 ${credits}`)
      const resultBase64 = Buffer.from(data).toString('base64')
      return res.json({ image: `data:image/png;base64,${resultBase64}`, credits })
    } catch (err) {
      if (!err.response) throw err  // 非 HTTP 错误（网络/超时）直接抛出

      const errMsg = parseRemoveBgError(err.response.data)
      const status  = err.response.status
      console.warn(`[segment] type=person 失败 (${status}): ${errMsg}`)

      // ── 第二次尝试：仅在"识别不到前景"时降级为 type=auto ──
      if (errMsg.toLowerCase().includes(FOREGROUND_ERR)) {
        console.log('[segment] 降级重试（type=auto）...')
        startTime = Date.now()

        try {
          const { data: data2, credits: credits2 } =
            await callRemoveBg(imageBuffer, mimeType, apiKey, 'auto')
          console.log(`[segment] 降级成功，耗时 ${Date.now() - startTime}ms，积分 ${credits2}`)
          const resultBase64 = Buffer.from(data2).toString('base64')
          return res.json({ image: `data:image/png;base64,${resultBase64}`, credits: credits2 })
        } catch (err2) {
          if (err2.response) {
            const errMsg2 = parseRemoveBgError(err2.response.data)
            console.error(`[segment] 降级也失败 (${err2.response.status}): ${errMsg2}`)
            return res.status(err2.response.status).json({ error: errMsg2 })
          }
          throw err2
        }
      }

      // 其他错误（积分不足、格式错误等）直接返回
      return res.status(status).json({ error: errMsg })
    }
  } catch (err) {
    console.error('[segment] 系统错误:', err.message)
    res.status(500).json({ error: '抠图服务暂时不可用，请重试' })
  }
})

module.exports = router
