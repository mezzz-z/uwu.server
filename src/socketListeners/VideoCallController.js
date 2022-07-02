module.exports = function(socket){
    return {
        handleJoiningRoom: (roomId) => {
            const user = this.users.find(user => user.socketId === socket.id)
        
            // START validation
            // invitationCode is the roomId
            const videoCallRoom = this.videoCallRooms.find(room => room.invitationCode === roomId)
            if(!videoCallRoom || !videoCallRoom.membersSocketsIds.includes(socket.id)) {
                socket.emit('video-call/access-denied', 'Room is not available anymore')
                this.io.to(roomId).emit('video-call/access-denied', 'Your friend just left the room')
                return
            }
            // END validation
            
            if(user.currentRoom) {
                socket.leave(user.currentRoom.roomId)
            }
            socket.join(roomId)
            socket.emit('video-call/validated')
            socket.to(roomId).emit('video-call/peer-joined')
        },
        handleRejectingInvite: (inviteSenderId) => {
            const inviteSender = this.users.find(user => user.userId === inviteSenderId)
            this.io.to(inviteSender.socketId).emit('video-call/invite-rejected')
        },
        handleSendingInvite: ({userId, invitationCode}) => {
            const targetUser = this.users.find(user => user.userId === userId)
            if(!targetUser) return
            
            const isTargetInVideoCallRoom = 
                this.videoCallRooms.find(room => room.membersSocketsIds.includes(targetUser.socketId))

            if(isTargetInVideoCallRoom) {
                return socket.emit('video-call/invitation-result', {
                    success: false,
                    message: 'Your friend is in another call, sorry'
                })
            }
        
            const inviteSender = this.users.find(user => user.socketId === socket.id)
        
            this.videoCallRooms.push({
                invitationCode,
                membersSocketsIds: [targetUser.socketId, inviteSender.socketId]
            })
            
            socket.emit('video-call/invitation-result', {success: true})
        
            this.io.to(targetUser.socketId).emit('video-call/incoming-invite', {
                invitationCode: invitationCode,
                senderId: inviteSender.userId
            })
        },
        handleLeavingRoom: (roomId) => {
            this.videoCallRooms = this.videoCallRooms.filter(room => room.invitationCode !== roomId)
            socket.to(roomId).emit('video-call/access-denied', 'You friend just ended the call')
            this.io.in(roomId).socketsLeave(roomId)
        },
        handleSignaling: (data) => {
            switch (data.type) {
                case 'offer':
                    socket.to(data.roomId).emit('video-call/signal', {type: 'offer', offer: data.offer})
                    break;
        
                case 'answer':
                    socket.to(data.roomId).emit('video-call/signal', {type: 'answer', answer: data.answer})
                    break;
        
                case 'candidate':
                    socket.to(data.roomId).emit('video-call/signal', {type: 'candidate', candidate: data.candidate})
                    break
                    
                default: return
            }
        }
    }
}