const multer = require('multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')

const BG_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'backgrounds')
  : path.join(__dirname, '../backgrounds')
if (!fs.existsSync(BG_DIR)) fs.mkdirSync(BG_DIR, { recursive: true })

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BG_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${uuidv4()}${ALLOWED_EXTS.includes(ext) ? ext : '.jpg'}`)
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true)
  else cb(new Error('Only image files allowed'), false)
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB for backgrounds
})
