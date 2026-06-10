const express = require('express')
const router = express.Router()
const upload = require('../middleware/upload')
const { uploadImage, getImage } = require('../controllers/imageController')

router.post('/upload', upload.single('image'), uploadImage)
router.get('/:id', getImage)

module.exports = router
