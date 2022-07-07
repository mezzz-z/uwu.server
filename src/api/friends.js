const jwt = require("jsonwebtoken")
const db = require("../database/database")
const UsersController = require("../controller/Users")
const BadRequestError = require('../errors/BadRequestError')
const UnauthorizedError = require('../errors/UnauthorizedError')
const asyncWrapper = require('../helpers/async-wrapper')
const bcrypt = require("bcrypt")

class Friends extends UsersController {
    sendFriendRequest = asyncWrapper( async (req, res) => {
        const requestReceiverId = req.params.userId
        const currentUserId = req.user.userId

        if(currentUserId === requestReceiverId) throw new BadRequestError('User not found')
        if(!requestReceiverId) throw new BadRequestError('Request receiver id is required')

        //! MAIN VALIDATION
        let friendRequests = await db.query(`
            select friend_requests from users WHERE 
                user_id = $1 
                AND 
                $2 = ANY(friend_requests)
            `, [requestReceiverId, currentUserId])

        if(friendRequests.length > 0) throw new BadRequestError("You have already sent a friend request to this user")


        let friends = await db.query(`
            select friend_requests from users WHERE 
                user_id = $1 
                AND 
                $2 = ANY(friends)
            `, [requestReceiverId, currentUserId])

        if(friends.length > 0) throw new BadRequestError("You cant send a friend request to this user")
        //! END VALIDATION



        // send a friends request
        await db.query(`
            UPDATE users SET friend_requests = array_append(friend_requests, $1)
            WHERE user_id = $2
        `, [currentUserId, requestReceiverId])

        res.status(200).json({message: 'friend request sent'})

    })

    friendRequestAnswer = asyncWrapper( async (req, res) => {
        const answerReceiverId = req.params.userId
        const currentUserId = req.user.userId
        const accepted = req.body.accepted
        if(typeof accepted === 'undefined' || accepted === null) throw new BadRequestError('answer is required')
        if(!answerReceiverId) throw new BadRequestError('answer sender id is required')

        //! MAIN VALIDATION
        const friendRequests = await db.query(`
            select friend_requests from users
            WHERE user_id = $1
            AND $2 = ANY(friend_requests)
        `, [currentUserId, answerReceiverId])

        if(!friendRequests.length > 0) throw new BadRequestError('friend request is not available')


        await db.query(`
            UPDATE users SET friend_requests = array_remove(friend_requests, $1)
            WHERE user_id = $2
        `, [answerReceiverId, currentUserId])

        
        if(accepted){
            const answerReceiver = await db.query(`
                UPDATE users SET friends = array_append(friends, $1)
                WHERE user_id = $2 RETURNING ${this.allowedFields} `, [currentUserId, answerReceiverId])
            const answerSender = await db.query(`
                UPDATE users SET friends = array_append(friends, $1)
                WHERE user_id = $2 RETURNING ${this.allowedFields}`, [answerReceiverId, currentUserId])

            return res.status(200).json({
                message: `Friend request accepted`,
                answerReceiver: answerReceiver[0],
                answerSender: answerSender[0],
                accepted: true
            })
        }

        res.status(200).json({message: "Friend request rejected", accepted: false})
    })


    removeFriend = asyncWrapper ( async (req ,res) => {
        const friendId = req.params.userId
        const currentUserId = req.user.userId
        if(!friendId) throw new BadRequestError("Friend's id is required")

        const currentUserFriends = await db.query(`
            SELECT friends FROM users
            WHERE 
            user_id = $2 AND $1 = ANY(friends) OR user_id = $1 AND $2 = ANY(friends)
        `, [friendId, currentUserId])

    
        if(currentUserFriends.length <= 0) throw new BadRequestError('this user is not exists or is not your friend')

        // remove friend from the both sides
        await db.query(`
            UPDATE users SET friends = array_remove(friends, $1)
            WHERE user_id = $2`, [friendId, currentUserId])
        await db.query(`
            UPDATE users SET friends = array_remove(friends, $1)
            WHERE user_id = $2`, [currentUserId, friendId])


        res.status(200).json({message: "the user deleted from your friend list successfully"})
    })

    getUserFriends = asyncWrapper ( async (req, res) => {
        const userId = req.user.userId
        let user = await db.query(`
            SELECT friends from users WHERE user_id = $1
        `, [userId])

        user = user[0]
        
        const userFriendsIds = user.friends

        const userFriends = await db.query(`
            SELECT ${this.allowedFields} FROM users WHERE user_id = ANY ($1)
        `, [userFriendsIds])
        res.json({userFriends})
    })

    getUserFriendRequests = ( async (req, res) => {
        const currentUserId = req.user.userId

        const userFriendRequests = await db.query(`
            SELECT ${this.allowedFields} FROM users
            WHERE user_id = ANY(CAST ((
                SELECT friend_requests FROM users
                WHERE user_id = $1
            ) AS UUID[]))
        `, [currentUserId])

        res.json({friendRequests: userFriendRequests})
    })
}

module.exports = new Friends()