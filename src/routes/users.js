const checkAuth = require('../middleware/checkAuth')
const router = require("express").Router()
const usersAPI = require('../api/users')
const friendsAPI = require('../api/friends')


router.get('/', usersAPI.getUsers)
router.get('/current', checkAuth, usersAPI.getCurrentUser)
router.get('/current/friendRequests', checkAuth, friendsAPI.getUserFriendRequests)
router.get('/current/friends', checkAuth, friendsAPI.getUserFriends)
router.get('/:field/:value',  usersAPI.getUser)


module.exports = router