const cors = require('cors')

const corsOptions = {
  origin(origin, callback) {
    // 允许无 origin（curl、移动端 WebView 等）及所有来源（开发环境）
    // 生产环境可替换为具体域名白名单
    callback(null, true)
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 204
}

module.exports = cors(corsOptions)
