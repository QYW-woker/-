const path = require('path')
const fs = require('fs')
const os = require('os')

const ALBUM_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'album')
  : path.join(__dirname, '../album')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const iface of Object.values(interfaces)) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) return alias.address
    }
  }
  return '127.0.0.1'
}

exports.listPhotos = (req, res) => {
  try {
    ensureDir(ALBUM_DIR)
    const files = fs.readdirSync(ALBUM_DIR)
      .filter(f => /\.jpg$/i.test(f) && f !== '.gitkeep')
      .map(f => {
        const stat = fs.statSync(path.join(ALBUM_DIR, f))
        return { filename: f, mtime: stat.mtimeMs }
      })
      .sort((a, b) => b.mtime - a.mtime)
      .map(({ filename }) => ({
        id: filename,
        src: `/api/photos/file/${filename}`,
        thumbnail: `/api/photos/file/${filename}`
      }))
    res.json({ success: true, photos: files })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.servePhoto = (req, res) => {
  const safe = path.basename(req.params.filename)
  const filepath = path.join(ALBUM_DIR, safe)
  if (!fs.existsSync(filepath)) return res.status(404).send('Not found')
  res.setHeader('Content-Disposition', `attachment; filename="photo-${safe}"`)
  res.sendFile(filepath)
}

exports.deletePhoto = (req, res) => {
  const safe = path.basename(req.params.id)
  const filepath = path.join(ALBUM_DIR, safe)
  if (!fs.existsSync(filepath)) return res.status(404).json({ success: false, message: 'Not found' })
  try {
    fs.unlinkSync(filepath)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
