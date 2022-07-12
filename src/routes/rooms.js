const router = require("express").Router()
const roomsAPI = require('../api/rooms')
const checkAuth = require("../middleware/checkAuth")

router.get('/', roomsAPI.getRooms)
router.get('/:roomId', roomsAPI.getRoom)
router.get('/:roomId/messages', roomsAPI.getRoomMessages)
router.post('/', checkAuth, roomsAPI.createRoom)
router.post('/:roomId/addNewUser/:userId', checkAuth, roomsAPI.addNewUser)



module.exports = router