const router = require("express").Router()
const roomsAPI = require('../api/rooms')

router.get('/', roomsAPI.getRooms)
router.get('/:roomId', roomsAPI.getRoom)
router.get('/:roomId/messages', roomsAPI.getRoomMessages)
router.get('/:roomId/members', roomsAPI.getRoomMembers)
router.post('/', roomsAPI.createRoom)
router.post('/:roomId/addNewUser/:userId', roomsAPI.addNewUser)



module.exports = router