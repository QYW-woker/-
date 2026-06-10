const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/albumController')

router.get('/', ctrl.listPhotos)
router.get('/file/:filename', ctrl.servePhoto)
router.delete('/:id', ctrl.deletePhoto)

module.exports = router
