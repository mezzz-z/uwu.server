const router = require("express").Router()
const roomsAPI = require('../api/rooms')

router.get('/', roomsAPI.getRooms)
router.get('/:roomId', roomsAPI.getRoom)

/**
 * @description create a new room
 * @parameters usersIds, roomName
 */
router.post('/', roomsAPI.createRoom)

module.exports = router