const api = require('axios').default.create({baseURL: 'http://localhost:8080/api/v1/'})

module.exports = function(socket){
    return {
        // send the created room for all (online) room members in real-time
        handleIncomingFriendRequestResponse: ({reqReceiverId, accepted}) => {

            // SEND REQ THROUGH API




            const isTargetOnline = this.users.find(user => user.userId === reqReceiverId)
        },

        handleSendingFriendRequest: async ({receiverId, accessToken}) => {
            const requestSender = this.users.find(user => user.socketId === socket.id)
            if(!requestSender) return

            try {
                // sending friend request
                const { data } = await api.post(`/friends/${receiverId}/sendRequest`, {}, {
                    headers: {'authorization': 'Bearer ' + accessToken}
                })

                socket.emit('friends/friend-request-sent', {success: true, message: data.message})

                // send friend request in real-time if user is online
                const requestReceiver = this.users.find(user => user.userId === receiverId)
                if(!requestReceiver) return

                // we can get sender data with his accessToken and buy some time
                // but we want to get public data
                const {data: {user}} = await api.get(`/users/user_id/${requestSender.userId}`)
                this.io.to(requestReceiver.socketId).emit('friends/incoming-friend-request', { sender: user })
                
                
            } catch (error) {
                console.log(error)
                socket.emit('friends/friend-request-sent', ({
                    success: false,
                    message: error.response?.data.message || error.message
                }))
            }

        }
    }
}