const jwt = require("jsonwebtoken")
const db = require("../database/database")

const defaultExpirationTime = 1000 * 60 * 60 * 24 * 7

module.exports = class UsersController {

    allowedFields = 'user_id, username, email, profile_picture, status'

    async getUserByFilter(filter){
        const stringifiedFilter = db.stringifyFilter(filter)
        const data = await db.query(`
            SELECT * FROM users
            WHERE ${stringifiedFilter}
        `)

        return data[0]
    }
}
