/**
 * Canvas 图层合成：人像（透明背景）+ 替换背景
 *
 * 合成步骤（ISNet 已处理边缘，无需额外蒙版操作）：
 *  1. 主画布绘制背景（cover 填充模式）
 *  2. source-over 叠加透明人像（alpha 通道由 @imgly/background-removal 生成）
 *
 * 双屏模式（32:9 / 3840×1080）：
 *  - 输出画布尺寸扩展为 3840×1080
 *  - 人像等比缩放至 1080px 高，水平居中（人物中心对准接缝）
 *  - screenGap 补偿物理黑边偏移
 */
export function useCanvas() {

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`图片加载失败：${src}`))
      img.src = src
    })
  }

  /** cover 模式绘制参数 */
  function coverParams(imgW, imgH, canvasW, canvasH) {
    const scale = Math.max(canvasW / imgW, canvasH / imgH)
    const drawW = imgW * scale
    const drawH = imgH * scale
    const dx = (canvasW - drawW) / 2
    const dy = (canvasH - drawH) / 2
    return { dx, dy, drawW, drawH }
  }

  /**
   * 合成透明人像与背景
   * @param {string} backgroundSrc       - 背景图路径（URL 或 base64）
   * @param {HTMLImageElement} personImg  - 带透明通道的人像图（@imgly/background-removal 输出）
   * @param {object} [options]
   * @param {boolean} [options.dualScreen=false] - 启用 32:9 双屏输出 (3840×1080)
   * @param {number}  [options.screenGap=40]     - 物理黑边补偿像素数
   * @returns {Promise<string>} 合成图片 base64（JPEG）
   */
  async function composite(backgroundSrc, personImg, options = {}) {
    const { dualScreen = false, screenGap = 40 } = options

    const bgImg = await loadImage(backgroundSrc)

    const personW = personImg.naturalWidth
    const personH = personImg.naturalHeight

    // 输出画布尺寸
    const outW = dualScreen ? 3840 : personW
    const outH = dualScreen ? 1080 : personH

    // 双屏模式：人像缩放到 1080px 高，水平居中偏向接缝
    const personScale = dualScreen ? outH / personH : 1
    const pW = Math.round(personW * personScale)
    const pH = Math.round(personH * personScale)
    const pX = dualScreen ? Math.round((outW - pW) / 2 - screenGap / 2) : 0
    const pY = dualScreen ? Math.round((outH - pH) / 2) : 0

    // 主画布：绘制背景 + 叠加透明人像
    const mainCanvas = document.createElement('canvas')
    mainCanvas.width = outW
    mainCanvas.height = outH
    const ctx = mainCanvas.getContext('2d')

    // 背景 cover 填充
    const bg = coverParams(bgImg.naturalWidth, bgImg.naturalHeight, outW, outH)
    ctx.drawImage(bgImg, bg.dx, bg.dy, bg.drawW, bg.drawH)

    // 叠加人像（alpha 通道自然融合，无锯齿）
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(personImg, pX, pY, pW, pH)

    return mainCanvas.toDataURL('image/jpeg', 0.92)
  }

  return { composite }
}
