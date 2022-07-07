const api = require('axios').default.create({baseURL: 'http://localhost:8080/api/v1/'})

module.exports = function(socket){
    return {
        // send the created room for all (online) room members in real-time
        handleIncomingFriendRequestAnswer: async ({answerReceiverId: targetId, accepted, accessToken}) => {
            // SEND REQ THROUGH API
            try {
                const { data } = await api.post(
                    `/friends/${targetId}/sendRequestAnswer`,
                    {accepted},
                    {headers: {"authorization": "Bearer " + accessToken}}
                )

                const answerReceiver = 
                    data.answerReceiver || { user_id: targetId }
                const answerSender =
                    data.answerSender || { user_id: (this.users.find(user => user.socketId === socket.id)).userId }

                // we need answer receiver data
                // bcs we will add the data as a new friend to answerSender's friends
                socket.emit('friends/friend-request-answer-sent', {
                    answerReceiver,
                    accepted: data.accepted,
                    success: true,
                    message: data.message })


                // if answer receiver is online
                // we need his data
                // bcs we will add the data as a new friend to answerReceiver's friends
                const answerReceiverSocketData = this.users.find(user => user.userId === answerReceiver.user_id)
                if(!answerReceiverSocketData) return
                socket.to(answerReceiverSocketData).emit('friends/incoming-friend-request-answer', {
                    accepted: data.accepted,
                    answerSender
                })


            } catch (error) {
                socket.emit('friends/friend-request-answer-sent', {message: error.response?.data.message || "Something went wrong"})
            }
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
                socket.emit('friends/friend-request-sent', ({
                    success: false,
                    message: error.response?.data.message || "Something went wrong"
                }))
            }

        }
    }
}