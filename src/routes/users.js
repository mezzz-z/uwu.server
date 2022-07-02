const checkAuth = require('../middleware/checkAuth')
const router = require("express").Router()
const usersAPI = require('../api/users')


router.get('/', usersAPI.getUsers)
router.get('/current', checkAuth, usersAPI.getCurrentUser)
router.get('/:userId', usersAPI.getUser)


module.exports = router