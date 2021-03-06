const db = require('../database/database.js')
const api = require('axios').default.create({baseURL: 'http://localhost:8080/api/v1/'})

const sendGivenRoomToTargetUser = (givenRoom, targetUser, io) => {

    let room = {...givenRoom, notificationsIds: []}

    if(typeof targetUser !== 'object') return
    const isTargetUserArray = Array.isArray(targetUser)

    if(!isTargetUserArray) {
        return io.to(targetUser.socketId).emit('chat-room/new-room-created', room)
    }

    targetUser.forEach(user => {
        io.to(user.socketId).emit('chat-room/new-room-created', room)
    })
}

module.exports = function(socket){
    return {
        // send the created room for all (online) room members in real-time
        handleChatRoomCreated: (room) => {
            const roomOnlineMembers = room.users_ids.map(id => {
                const onlineUser = this.users.find(user => user.userId === id);
                if(!onlineUser) return
                return onlineUser
            })
            sendGivenRoomToTargetUser(room, roomOnlineMembers, this.io)
        },
        // create and submit the given room
        handleSubmitCurrentRoom: async ({room, userId, lastRoomId}) => {
            const userIndex = this.users.findIndex(user => user.userId === userId)
            if(userIndex === -1) return
            // join user to the room (leave the last room if last room exists)
            if(lastRoomId){socket.leave(lastRoomId)}
            socket.join(room.roomId);
            // submit current room
            this.users[userIndex].currentRoom = room

            // remove room notifications from user
            await db.query(`
            DELETE FROM notifications WHERE
            owner_id = $1 AND room_id = $2
            `, [userId, room.roomId])
            
            const user = this.users[userIndex]
            socket.emit('chat-room/current-room-submitted', user.currentRoom)
            this.io.to(room.roomId).emit('chat-room/new-member-joined', user.userId)
        },
        handleNewMessage: async ({roomId, messageText, senderId}) => {
            const user = this.users.find(user => socket.id === user.socketId)
            if(!user || !user.currentRoom) return

            // create the message
            let createdMessage = await db.query(`
                WITH inserted AS (
                    INSERT INTO messages (message_text, sender_id, room_id)
                    VALUES($1, $2, $3) RETURNING *
                )
                SELECT inserted.*, users.username, users.profile_picture
                FROM inserted INNER JOIN users ON users.user_id = inserted.sender_id
                
    
                `, [messageText, senderId, roomId])
    
            createdMessage = createdMessage[0]
            // send the message in real-time if everything is okay
            this.io.in(roomId).emit('chat-room/new-message', createdMessage)
            // send message as a notification for people who are not in the chat 
            // absentMembers: members that are ONLINE but they are NOT inside of room
            let absentMembers = []
            let offlineMembersIds = []
            user.currentRoom.usersIds.map(id => {
                // if user.currentRoom.roomId !== roomId //! user is absent
                // if !user //! user is offline
                const user = this.users.find((user) => user.userId === id)
                if(!user) {
                    offlineMembersIds.push(id)
                    return
                }
                if(!user.currentRoom || user.currentRoom.roomId !== roomId){
                    absentMembers.push({userId: user.userId, socketId: user.socketId})
                    return
                }
            })
            const absentMembersIds = absentMembers.map(member => member.userId)
            // INSERTING NOTIFICATION IN DATABASE
            for(let id of [...offlineMembersIds, ...absentMembersIds]){
                const notification = await db.query(`
                    INSERT INTO notifications
                    (message_id, message_sender_id, room_id, owner_id)
                    VALUES($1, $2, $3, $4) RETURNING notification_id, owner_id
                `, [createdMessage.message_id, senderId, roomId, id])

                // GET createdNotificationId if notification owner is absent
                // we need to get the notificationId bcs we will send the notification in real-time to that user
                if(absentMembersIds.includes(id)){
                    absentMembers.map(member => {
                        if(id !== member.userId) return  
                        member.notificationId = notification[0].notification_id
                    })
                }
            }
            // send notification to absent members in real-time
            absentMembers.forEach(member => {
                this.io.to(member.socketId).emit('chat-room/notification', {
                    notificationId: member.notificationId,
                    roomId: roomId
                })
            });
        },
        joinNewUser: async ({userId, roomId, accessToken}) => {
            try {
                const { data } = await api.post(
                    `/rooms/${roomId}/addNewUser/${userId}`, {},
                    {headers: {'authorization': 'Bearer ' + accessToken}})

                socket.emit('chat-room/new-user-added', {success: true, message: data.message})

                const user = this.users.find(user => user.userId === userId)
                if(!user) return
                
                sendGivenRoomToTargetUser(data.targetRoom, user, this.io)

            } catch (error) {
                socket.emit('chat-room/new-user-added', {
                    success: false, message: error.response?.data?.message || 'something went wrong'
                })
            }

            // send notification in real-time COMING SOON
        },
        deleteMessage: async ({roomId, messageId}) => {
            try {
                await db.query('DELETE FROM notifications WHERE message_id = $1', [messageId])
                const deletedMessageData = await db.query(`DELETE FROM messages WHERE message_id = $1 RETURNING message_id`, [messageId])

                if(deletedMessageData.length === 0) return

                
                this.io.to(roomId).emit('chat-room/message-deleted', deletedMessageData[0].message_id)

            } catch (error) {
                return console.log(error)
            }
        },

        editMessage: async ({newMessageText, messageId, roomId}) => {
            try {
                const editedMessageData = await db.query(`
                    UPDATE messages SET message_text = $1 WHERE message_id = $2
                    RETURNING *`, [newMessageText, messageId])

                this.io.to(roomId).emit('chat-room/message-edited', (editedMessageData[0]))
                
            } catch (error) {
                console.log(error)
            }
        }
    }
}