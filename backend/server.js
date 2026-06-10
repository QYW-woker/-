require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const express = require('express')
const path = require('path')
const corsMiddleware = require('./middleware/cors')
const imageRoutes = require('./routes/imageRoutes')
const userBgRoutes = require('./routes/userBgRoutes')
const bgRoutes = require('./routes/bgRoutes')
const albumRoutes = require('./routes/albumRoutes')
const segmentRoutes = require('./routes/segmentRoutes')
const { startCleanupJob } = require('./utils/fileCleanup')

const app = express()
const PORT = process.env.PORT || 4000
const HOST = process.env.HOST || '0.0.0.0'

// 中间件
app.use(corsMiddleware)
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true }))

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 图片路由
app.use('/api/image', imageRoutes)

// 旧版用户背景（保留兼容）
app.use('/api/user-background', userBgRoutes)
// 统一背景库
app.use('/api/backgrounds', bgRoutes)
// 相册
app.use('/api/photos', albumRoutes)
// 人像抠图（remove.bg）
app.use('/api/segment', segmentRoutes)

// 自动检测前端构建产物，存在即托管（不依赖 NODE_ENV）
const fs = require('fs')
const distPath = path.join(__dirname, '..', 'frontend', 'dist')
if (fs.existsSync(path.join(distPath, 'index.html'))) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')))
  console.log(`  前端静态文件：${distPath}`)
}

// 错误处理中间件
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `文件超过大小限制（最大 ${process.env.MAX_FILE_SIZE_MB || 10}MB）`
    })
  }
  console.error('[error]', err.message)
  res.status(500).json({ success: false, message: err.message || '服务器内部错误' })
})

// 启动服务（优先 HTTPS，回退 HTTP）
const certPath = path.join(__dirname, 'certs', 'cert.pem')
const keyPath  = path.join(__dirname, 'certs', 'key.pem')
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const https = require('https')
  const http = require('http')
  const credentials = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
  https.createServer(credentials, app).listen(PORT, HOST, () => {
    console.log(`\n后端服务已启动 (HTTPS)`)
    console.log(`  本地访问：https://localhost:${PORT}`)
    console.log(`  健康检查：https://localhost:${PORT}/api/health\n`)
    startCleanupJob()
  })

  // 额外的 HTTP 服务器，仅暴露图片下载路由，供手机扫码使用
  const IMAGE_HTTP_PORT = parseInt(process.env.IMAGE_HTTP_PORT || '4001')
  const imageHttpApp = express()
  imageHttpApp.use('/api/image', imageRoutes)
  http.createServer(imageHttpApp).listen(IMAGE_HTTP_PORT, HOST, () => {
    console.log(`  图片下载服务 (HTTP)：http://localhost:${IMAGE_HTTP_PORT}/api/image/`)
  })
} else {
  app.listen(PORT, HOST, () => {
    console.log(`\n后端服务已启动 (HTTP)`)
    console.log(`  本地访问：http://localhost:${PORT}`)
    console.log(`  健康检查：http://localhost:${PORT}/api/health\n`)
    startCleanupJob()
  })
}
