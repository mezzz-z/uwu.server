const db = require("../database/database")
const UsersController = require("../controller/Users")
const BadRequestError = require('../errors/BadRequestError')
const UnauthorizedError = require('../errors/UnauthorizedError')
const asyncWrapper = require('../helpers/async-wrapper')
const { request } = require("http")

class Rooms extends UsersController {

    getRoom = asyncWrapper( async (req, res) => {
        const roomId = req.params.roomId
        if(!roomId) throw new BadRequestError("roomId is required")

        const data = await db.query(`SELECT * FROM rooms WHERE room_id = $1`, [roomId])
        const room = data[0]
        if(!room) throw new BadRequestError("room not found")

        res.status(200).json({room})
    })

    getRoomMessages = asyncWrapper( async (req, res) => {

        const roomId = req.params.roomId
        if(!roomId) throw new BadRequestError("roomId is required")

        const filter = {
            offset: req.query.offset || 0,
            limit: 25
        }
        
        let data = await db.query(`
            SELECT messages.message_id, messages.message_text, messages.sender_id, messages.created_at,
            users.username, users.profile_picture FROM
            messages LEFT JOIN users ON messages.sender_id = users.user_id
            WHERE messages.room_id = $1 ORDER BY created_at OFFSET ${filter.offset} LIMIT ${filter.limit}
        `, [roomId])
        
        const messages = data.length === 0  ? [] : data.map(message => {
            return {
                message_id: message.message_id,
                message_text: message.message_text,
                created_at: message.created_at,
                sender: {
                    user_id: message.sender_id,
                    profile_picture: message.profile_picture,
                    username: message.username
                }
            }
        })
        
        res.status(200).json({messages})
    })

    createRoom = asyncWrapper( async (req, res) => {
        const currentUserId = req.user.userId
        const { usersIds, roomName } = req.body

        if(!roomName) throw new BadRequestError("roomName is required")

        const roomUsers = [...usersIds || [], currentUserId]

        let createdRoom = await db.query(`
            INSERT INTO rooms (users_ids, room_name)
            VALUES ($1, $2)
            RETURNING *
        `, [roomUsers, roomName])

        if(createdRoom.length <= 0 ) throw new BadRequestError("cannot create the room")
        res.status(201).json({createdRoom: createdRoom[0], message: 'Room created successfully'})
    })


    getRooms = asyncWrapper( async (req, res) => {
        const userId = req.user.userId

        const rooms = await db.query(`
            SELECT
            rooms.room_id, rooms.room_name, notifications.notification_id
            FROM
            rooms LEFT JOIN notifications ON (
                rooms.room_id = notifications.room_id AND
                $1 = notifications.owner_id
            )
            WHERE $1 = ANY(rooms.users_ids) ORDER BY rooms.created_at DESC
        `, [userId])


        //! TODO: use (GROUP BY, SUM, COUNT ... inside of query) instead of using map
        let modifiedRooms = []
        rooms.map(room => {
            const sameRoomIndex = modifiedRooms.findIndex(modifiedRoom => modifiedRoom.room_id === room.room_id)
            if(sameRoomIndex !== -1) {
                return modifiedRooms[sameRoomIndex].notificationsIds.push(room.notification_id)
            }
            modifiedRooms.push({
                room_name: room.room_name,
                room_id: room.room_id,
                notificationsIds: room.notification_id ? [room.notification_id] : []
            })
        })


        res.status(200).json({rooms: modifiedRooms})
    })
}

module.exports = new Rooms()