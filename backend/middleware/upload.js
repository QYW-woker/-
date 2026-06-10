const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10')

const UPLOADS_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOADS_DIR)
  },
  filename(req, file, cb) {
    // 仅用 UUID 命名，避免路径遍历和文件名冲突
    cb(null, `${uuidv4()}.jpg`)
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('只允许上传图片文件'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024
  }
})

module.exports = upload
