const path = require('path')
const fs = require('fs')
const os = require('os')

const UPLOADS_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(__dirname, '..', 'uploads')
const ALBUM_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'album')
  : path.join(__dirname, '..', 'album')

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })
if (!fs.existsSync(ALBUM_DIR)) fs.mkdirSync(ALBUM_DIR, { recursive: true })

// 获取本机局域网 Wi-Fi IP
// 优先级：LOCAL_IP 环境变量 > Wi-Fi/以太网接口 > 任意非 loopback IPv4
// 跳过 VPN 隧道（utun*）、虚拟网卡（vmnet*、bridge*）等接口
function getLocalIP() {
  if (process.env.LOCAL_IP) return process.env.LOCAL_IP

  const interfaces = os.networkInterfaces()

  const PREFERRED = ['bridge100', 'en0', 'en1', 'en2', 'eth0', 'eth1', 'wlan0', 'wlan1', 'Wi-Fi', '以太网', 'WLAN']
  const EXCLUDED_PREFIXES = ['utun', 'bridge', 'vmnet', 'veth', 'awdl', 'llw', 'anpi', 'stf', 'gif', 'lo']

  for (const name of PREFERRED) {
    const iface = interfaces[name]
    if (!iface) continue
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) return alias.address
    }
  }
  for (const [name, iface] of Object.entries(interfaces)) {
    if (EXCLUDED_PREFIXES.some(p => name.startsWith(p))) continue
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) return alias.address
    }
  }
  return '127.0.0.1'
}

// 是否经过反向代理转发（云平台如 Render/Railway 会带 x-forwarded-* 头）
function isProxiedRequest(req) {
  return Boolean(req.headers['x-forwarded-host'] || req.headers['x-forwarded-proto'])
}

// 从请求头推导对外基础 URL（云平台单域名 HTTPS 场景）
function getRequestBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto']?.split(',')[0].trim() || req.protocol || 'https'
  const host = req.headers['x-forwarded-host']?.split(',')[0].trim() || req.get('host')
  return `${proto}://${host}`
}

// POST /api/image/upload
async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未收到图片文件' })
    }

    const filename = req.file.filename   // <uuid>.jpg
    const id = filename.replace('.jpg', '')

    // 二维码下载地址优先级：
    //   1) IMAGE_PUBLIC_URL（局域网 HTTP 端口，供手机扫码下载）
    //   2) PUBLIC_URL（显式配置的公网/HTTPS 域名）
    //   3) 从请求头自动推导（云平台如 Render，单域名 HTTPS，无需预配）
    //   4) 降级到局域网 IP（本地开发模式）
    const url = process.env.IMAGE_PUBLIC_URL
      ? `${process.env.IMAGE_PUBLIC_URL}/api/image/${id}`
      : process.env.PUBLIC_URL
        ? `${process.env.PUBLIC_URL}/api/image/${id}`
        : isProxiedRequest(req)
          ? `${getRequestBaseUrl(req)}/api/image/${id}`
          : `http://${getLocalIP()}:${process.env.PORT || 4000}/api/image/${id}`

    // 同步保存到相册（永久存储）
    try {
      fs.copyFileSync(path.join(UPLOADS_DIR, filename), path.join(ALBUM_DIR, filename))
    } catch (e) {
      console.warn('[upload] 相册复制失败:', e.message)
    }

    const expireHours = parseInt(process.env.IMAGE_EXPIRE_HOURS || '2')
    const expiresAt = new Date(Date.now() + expireHours * 60 * 60 * 1000).toISOString()

    res.json({
      success: true,
      data: { id, url, expiresAt }
    })
  } catch (err) {
    console.error('[upload]', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
}

// GET /api/image/:id
function getImage(req, res) {
  const { id } = req.params

  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return res.status(400).json({ success: false, message: '无效的图片 ID' })
  }

  const filePath = path.join(UPLOADS_DIR, `${id}.jpg`)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: '图片不存在或已过期' })
  }

  res.setHeader('Content-Type', 'image/jpeg')
  res.setHeader('Content-Disposition', `inline; filename="photo-${id.slice(0, 8)}.jpg"`)
  res.setHeader('Cache-Control', 'public, max-age=7200')

  const stream = fs.createReadStream(filePath)
  stream.pipe(res)
  stream.on('error', (err) => {
    console.error('[getImage]', err)
    if (!res.headersSent) res.status(500).json({ success: false, message: '读取图片失败' })
  })
}

module.exports = { uploadImage, getImage }
