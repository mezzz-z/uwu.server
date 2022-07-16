const api = require("axios").default.create({
	baseURL: "http://localhost:8080/api/v1/",
});

module.exports = function (socket) {
	return {
		handleIncomingFriendRequestAnswer: async ({
			answerReceiverId: targetId,
			accepted,
			accessToken,
		}) => {
			try {
				const { data } = await api.post(
					`/friends/${targetId}/sendRequestAnswer`,
					{ accepted },
					{ headers: { "authorization": "Bearer " + accessToken } }
				);

				const answerReceiver = data.answerReceiver || { user_id: targetId };
				const answerSender = data.answerSender || {
					user_id: this.users.find(user => user.socketId === socket.id).userId,
				};

				socket.emit("friends/friend-request-answer-sent", {
					answerReceiver,
					accepted: data.accepted,
					success: true,
					message: data.message,
				});

				const answerReceiverSocketData = this.users.find(
					user => user.userId === answerReceiver.user_id
				);
				if (!answerReceiverSocketData) return;
				this.io
					.to(answerReceiverSocketData.socketId)
					.emit("friends/incoming-friend-request-answer", {
						accepted: data.accepted,
						answerSender,
					});
			} catch (error) {
				socket.emit("friends/friend-request-answer-sent", {
					message: error.response?.data.message || "Something went wrong",
				});
			}
		},

		handleSendingFriendRequest: async ({ receiverId, accessToken }) => {
			const requestSender = this.users.find(
				user => user.socketId === socket.id
			);
			if (!requestSender) return;

			try {
				// sending friend request
				const { data } = await api.post(
					`/friends/${receiverId}/sendRequest`,
					{},
					{
						headers: { authorization: "Bearer " + accessToken },
					}
				);

				socket.emit("friends/friend-request-sent", {
					success: true,
					message: data.message,
				});

				// send friend request in real-time if user is online
				const requestReceiver = this.users.find(
					user => user.userId === receiverId
				);
				if (!requestReceiver) return;

				// we can get sender data with his accessToken and buy some time
				// but we want to get public data
				const {
					data: { user },
				} = await api.get(`/users/user_id/${requestSender.userId}`);
				this.io
					.to(requestReceiver.socketId)
					.emit("friends/incoming-friend-request", { sender: user });
			} catch (error) {
				socket.emit("friends/friend-request-sent", {
					success: false,
					message: error.response?.data.message || "Something went wrong",
				});
			}
		},

		removeFriend: async ({ friendId, accessToken }) => {
			try {
				await api.delete(`/friends/${friendId}/removeFriend`, {
					headers: { "authorization": "Bearer " + accessToken },
				});

				socket.emit("friends/remove-friend-response", {
					success: true,
					friendId: friendId,
				});

				const friend = this.users.find(user => user.userId === friendId);
				if (!friend) return;

				const removeFriendRequestSender = this.users.find(
					user => user.socketId === socket.id
				);

				this.io.to(friend.socketId).emit("friends/remove-friend-notification", {
					from: removeFriendRequestSender.userId,
				});
			} catch (error) {
				socket.emit("friends/remove-friend-response", {
					message: error?.response?.data?.message || error.message,
					success: false,
				});
			}
		},
	};
};
