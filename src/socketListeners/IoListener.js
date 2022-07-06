const db = require('../database/database.js')

class IoListener {
    constructor(io){
        this.io = io
        this.users = []
        this.videoCallRooms = []


        // TODO: find a better solution
        this.VideoCallController = require('./VideoCallController.js')
        this.ChatRoomController = require('./ChatRoomController.js')
        this.FriendsController = require('./FriendsController.js')
    }

    sendCurrentUserStatus = async (userId, status) => {
        // sending given user status to his (online) friends
        const user = await db.query(`UPDATE users SET status = '${status}' WHERE user_id = $1 RETURNING friends`, [userId])
        const userFriends = user[0].friends || []
        if(userFriends.length === 0) return
        const onlineFriends = this.users.filter(user => userFriends.includes(user.userId))
        onlineFriends.forEach(friend => {
            this.io.to(friend.socketId).emit('global/friend-status-changed', {userId, status})
        });
    }
    


    startListening(){
         this.io.on('connect', (socket) => {
            // user joined
            // submitting the user
            socket.on('global/submit-user-id', async (userId) => {
                this.users.push({
                    userId: userId,
                    socketId: socket.id,
                    currentRoom: null
                })
                this.availableVideoCallRooms = []                
                await this.sendCurrentUserStatus(userId, 'online')
                const submittedUser = this.users.find(user => user.userId === userId)
                socket.emit('global/user-id-submitted', submittedUser.userId)
            })

            // chat room
            const chatRoomController = this.ChatRoomController(socket)
            socket.on('chat-room/submit-current-room', chatRoomController.handleSubmitCurrentRoom)
            socket.on('chat-room/new-room-created', chatRoomController.handleChatRoomCreated)
            socket.on('chat-room/new-message', chatRoomController.handleNewMessage)

            // video call
            const videoCallController = this.VideoCallController(socket)
            socket.on('video-call/send-invite', videoCallController.handleSendingInvite)
            socket.on('video-call/join-room', videoCallController.handleJoiningRoom)
            socket.on('video-call/reject-invite', videoCallController.handleRejectingInvite)
            socket.on('video-call/signal', videoCallController.handleSignaling)
            socket.on('video-call/leave-room', videoCallController.handleLeavingRoom)

            // friends
            const friendsController = this.FriendsController(socket)
            socket.on('friends/send-friend-request-response', friendsController.handleIncomingFriendRequestResponse)
            socket.on('friends/send-friend-request', friendsController.handleSendingFriendRequest)


            socket.on('disconnecting', () => {
                const user = this.users.find(user => user.socketId === socket.id)
                if(!user) return

                // if user disconnected from a video call find that videoCall info
                const userVideoCallRoom = this.videoCallRooms.find(
                    room => room.membersSocketsIds.includes(user.socketId))    
                // remove video call and emit a message that peer disconnected
                if(userVideoCallRoom){
                    socket
                    .to(userVideoCallRoom.invitationCode)
                    .emit('video-call/access-denied', 'Your friend just left the chat')
                    this.io.in(userVideoCallRoom.invitationCode).socketsLeave(userVideoCallRoom.invitationCode)
                    this.videoCallRooms = this.videoCallRooms.filter(
                        room => room.invitationCode !== userVideoCallRoom.invitationCode)
                }

                this.users = this.users.filter(submittedUser => submittedUser.userId !== user.userId)
                this.sendCurrentUserStatus(user.userId)
            })
        })
    }
}
module.exports = IoListener