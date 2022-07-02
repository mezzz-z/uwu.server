const router = require("express").Router()
const friendsAPI = require('../api/friends')


router.get('/', friendsAPI.userFriends)
router.post('/:userId/sendRequest', friendsAPI.sendFriendRequest)
router.delete('/:userId/removeFriend', friendsAPI.removeFriend)

/**
 * @description accept or reject friend request
 * @param {Boolean} accepted
 */
router.post('/:userId/requestResponse', friendsAPI.friendRequestResponse)


module.exports = router