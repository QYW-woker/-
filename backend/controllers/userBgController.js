const path = require('path')
const fs = require('fs')

const BG_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'user-backgrounds')
  : path.join(__dirname, '../user-backgrounds')

function ensureBgDir() {
  if (!fs.existsSync(BG_DIR)) fs.mkdirSync(BG_DIR, { recursive: true })
}

exports.uploadBg = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' })
  }
  const { filename } = req.file
  const src = `/api/user-background/file/${filename}`
  res.json({ success: true, id: filename, src })
}

exports.listBgs = (req, res) => {
  try {
    ensureBgDir()
    const files = fs.readdirSync(BG_DIR)
      .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
      .map(f => {
        const stat = fs.statSync(path.join(BG_DIR, f))
        return { filename: f, mtime: stat.mtimeMs }
      })
      .sort((a, b) => b.mtime - a.mtime) // newest first
      .map(({ filename }) => ({
        id: filename,
        src: `/api/user-background/file/${filename}`,
        thumbnail: `/api/user-background/file/${filename}`,
        isUserBg: true
      }))
    res.json({ success: true, backgrounds: files })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.deleteBg = (req, res) => {
  const safe = path.basename(req.params.id)
  const filepath = path.join(BG_DIR, safe)
  if (!filepath.startsWith(BG_DIR)) {
    return res.status(400).json({ success: false, message: 'Invalid id' })
  }
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ success: false, message: 'Not found' })
  }
  try {
    fs.unlinkSync(filepath)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.serveFile = (req, res) => {
  const safe = path.basename(req.params.filename)
  const filepath = path.join(BG_DIR, safe)
  if (!fs.existsSync(filepath)) {
    return res.status(404).send('Not found')
  }
  res.sendFile(filepath)
}
