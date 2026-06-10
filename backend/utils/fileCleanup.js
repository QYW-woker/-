const fs = require('fs')
const path = require('path')
const cron = require('node-cron')

const UPLOADS_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(__dirname, '..', 'uploads')

function cleanExpiredFiles() {
  const expireHours = parseInt(process.env.IMAGE_EXPIRE_HOURS || '2')
  const cutoffTime = Date.now() - expireHours * 60 * 60 * 1000

  try {
    const files = fs.readdirSync(UPLOADS_DIR)
    let cleaned = 0

    files.forEach((file) => {
      if (file === '.gitkeep') return
      const filePath = path.join(UPLOADS_DIR, file)
      const stat = fs.statSync(filePath)
      if (stat.mtimeMs < cutoffTime) {
        fs.unlinkSync(filePath)
        cleaned++
      }
    })

    if (cleaned > 0) {
      console.log(`[cleanup] 已清理 ${cleaned} 个过期图片文件`)
    }
  } catch (err) {
    console.error('[cleanup] 清理失败:', err.message)
  }
}

// 每小时执行一次清理
function startCleanupJob() {
  cleanExpiredFiles() // 启动时先执行一次
  cron.schedule('0 * * * *', cleanExpiredFiles)
  console.log('[cleanup] 定时清理任务已启动（每小时一次）')
}

module.exports = { startCleanupJob, cleanExpiredFiles }
