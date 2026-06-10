const express = require('express')
const router = express.Router()
const upload = require('../middleware/bgUpload')
const ctrl = require('../controllers/bgController')

router.get('/list', ctrl.listBgs)
router.get('/file/:filename', ctrl.serveFile)
router.post('/upload', upload.single('image'), ctrl.uploadBg)
router.delete('/:id', ctrl.deleteBg)

module.exports = router
