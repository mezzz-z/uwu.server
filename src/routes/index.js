const router = require("express").Router()
const checkAuth = require('../middleware/checkAuth')

router.use('/auth', require('./auth'))
router.use('/users', require('./users'))
router.use('/friends', checkAuth, require('./friends'))
router.use('/rooms', checkAuth, require('./rooms'))

module.exports = router