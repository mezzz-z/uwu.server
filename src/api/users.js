const jwt = require("jsonwebtoken")
const db = require("../database/database")
const UsersController = require("../controller/Users")
const BadRequestError = require('../errors/BadRequestError')
const UnauthorizedError = require('../errors/UnauthorizedError')
const asyncWrapper = require('../helpers/async-wrapper')
const bcrypt = require("bcrypt")


class User extends UsersController {
    
    getCurrentUser = asyncWrapper( async (req, res) => {
        const user = await db.query(`
        SELECT ${this.allowedFields} FROM users
        WHERE user_id = $1`, [req.user.userId])
        res.status(200).json({user: user[0]})
    })

    getUsers = asyncWrapper( async (req, res) => {
        const filter = {
            username: req.query.username || "%",
            limit: 25
        }

        const users = await db.query(`
            SELECT ${this.allowedFields} FROM users
            WHERE username ILIKE '%${filter.username}%'
            LIMIT ${filter.limit}
        `)

        res.status(200).json({users})
    })
    getUser = asyncWrapper( async (req, res) => {
        const userId = req.params.userId
        if(!userId) throw new BadRequestError("userId is required")

        const user = await db.query(`
        SELECT ${this.allowedFields} FROM users
        WHERE user_id = $1`, [userId])

        if(user.length <= 0) throw new BadRequestError('User not found')

        res.status(200).json({user: user[0]})
    })

}

module.exports = new User()