const db = require("../database/database.js");

class IoListener {
	constructor(io) {
		this.io = io;
		this.users = [];
		this.videoCallRooms = [];
		this.usersIntervals = [];

		// TODO: find a better solution
		this.VideoCallController = require("./VideoCallController.js");
		this.ChatRoomController = require("./ChatRoomController.js");
		this.FriendsController = require("./FriendsController.js");
	}

	updateAndSendUserStatus = async (userId, status) => {
		const user = await db.query(
			`UPDATE users SET status = '${status}' WHERE user_id = $1 RETURNING friends`,
			[userId]
		);
		const userFriends = user[0].friends || [];
		if (userFriends.length === 0) return;
		const onlineFriends = this.users.filter(user =>
			userFriends.includes(user.userId)
		);
		onlineFriends.forEach(friend => {
			this.io
				.to(friend.socketId)
				.emit("global/friend-status-changed", { userId, status });
		});
	};

	startListening() {
		this.io.on("connect", socket => {
			// user joined
			// submitting the user
			socket.on("global/submit-user-id", async userId => {
				this.availableVideoCallRooms = [];

				this.users.push({
					userId: userId,
					socketId: socket.id,
					currentRoom: null,
				});

				this.usersIntervals.push({
					userId: userId,
					interval: setInterval(async () => {
						const user = this.users.find(user => user.userId === userId);
						const userInterval = this.usersIntervals.find(
							userInterval => userInterval.userId === userId
						);
						if (!user) return clearInterval(userInterval.interval);

						const sockets = await (
							await this.io.fetchSockets()
						).map(socket => socket.id);
						const isUserOnline = sockets.includes(user.socketId);
						if (isUserOnline) return;

						await this.updateAndSendUserStatus(userId, "offline");
						clearInterval(userInterval.interval);
						this.users = this.users.filter(user => user.userId !== userId);
						this.usersIntervals = this.usersIntervals.filter(
							userInterval => userInterval.userId !== userId
						);
					}, 1000 * 60 * 20),
				});

				await this.updateAndSendUserStatus(userId, "online");

				const submittedUser = this.users.find(user => user.userId === userId);
				socket.emit("global/user-id-submitted", submittedUser.userId);
			});

			// chat room
			const chatRoomController = this.ChatRoomController(socket);
			socket.on(
				"chat-room/submit-current-room",
				chatRoomController.handleSubmitCurrentRoom
			);
			socket.on(
				"chat-room/new-room-created",
				chatRoomController.handleChatRoomCreated
			);
			socket.on("chat-room/new-message", chatRoomController.handleNewMessage);
			socket.on("chat-room/add-new-user", chatRoomController.joinNewUser);
			socket.on("chat-room/delete-message", chatRoomController.deleteMessage);
			socket.on("chat-room/edit-message", chatRoomController.editMessage);

			// video call
			const videoCallController = this.VideoCallController(socket);
			socket.on(
				"video-call/send-invite",
				videoCallController.handleSendingInvite
			);
			socket.on("video-call/join-room", videoCallController.handleJoiningRoom);
			socket.on(
				"video-call/reject-invite",
				videoCallController.handleRejectingInvite
			);
			socket.on("video-call/signal", videoCallController.handleSignaling);
			socket.on("video-call/leave-room", videoCallController.handleLeavingRoom);

			// friends
			const friendsController = this.FriendsController(socket);
			socket.on(
				"friends/send-friend-request-answer",
				friendsController.handleIncomingFriendRequestAnswer
			);
			socket.on(
				"friends/send-friend-request",
				friendsController.handleSendingFriendRequest
			);
			socket.on("friends/remove-friend", friendsController.removeFriend);

			socket.on("disconnecting", () => {
				const user = this.users.find(user => user.socketId === socket.id);
				if (!user) return;

				const { interval } = this.usersIntervals.find(
					userInterval => userInterval.userId === user.userId
				);
				clearInterval(interval);
				this.usersIntervals = this.usersIntervals.filter(
					userInterval => userInterval.userId !== user.userId
				);

				const userVideoCallRoom = this.videoCallRooms.find(room =>
					room.membersSocketsIds.includes(user.socketId)
				);

				if (userVideoCallRoom) {
					socket
						.to(userVideoCallRoom.invitationCode)
						.emit("video-call/access-denied", "Your friend just left the chat");
					this.io
						.in(userVideoCallRoom.invitationCode)
						.socketsLeave(userVideoCallRoom.invitationCode);
					this.videoCallRooms = this.videoCallRooms.filter(
						room => room.invitationCode !== userVideoCallRoom.invitationCode
					);
				}

				this.users = this.users.filter(
					submittedUser => submittedUser.userId !== user.userId
				);
				this.updateAndSendUserStatus(user.userId, "offline");
			});
		});
	}
}
module.exports = IoListener;
