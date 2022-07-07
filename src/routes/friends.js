const router = require("express").Router()
const friendsAPI = require('../api/friends')


router.get('/', friendsAPI.getUserFriends)
router.post('/:userId/sendRequest', friendsAPI.sendFriendRequest)
router.delete('/:userId/removeFriend', friendsAPI.removeFriend)
router.post('/:userId/sendRequestAnswer', friendsAPI.friendRequestAnswer)



module.exports = router