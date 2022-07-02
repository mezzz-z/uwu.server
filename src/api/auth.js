const jwt = require("jsonwebtoken")
const db = require("../database/database")
const AuthController = require("../controller/Auth")
const BadRequestError = require('../errors/BadRequestError')
const UnauthorizedError = require('../errors/UnauthorizedError')
const asyncWrapper = require('../helpers/async-wrapper')
const bcrypt = require("bcrypt")

class Auth extends AuthController {
    signup = asyncWrapper( async (req, res) => {
            // validation
            const {email, username, password} = req.body
            if(!email || !username || !password){
                throw new BadRequestError("Fields cannot be empty")
            }
            
            let isAny = undefined
            isAny = await this.getUserByFilter({email})
            if(isAny)throw new BadRequestError("Email is already in use")
            isAny = await this.getUserByFilter({username})
            if(isAny)throw new BadRequestError("username is already in use")


    
            const hashedData = await bcrypt.hash(password, 10)
    
            // create user
            await db.query(`
                INSERT INTO users
                (username, email, password)
                VALUES($1, $2, $3)
            `, [username, email, hashedData])
            
    
            res.status(201).json({message: "Your account has been created"})
    })

    login = asyncWrapper( async (req, res) => {
        
        const {username, password} = req.body
        if(!username || !password){
            throw new BadRequestError("Fields cannot be empty")
        }

        const user = await this.getUserByFilter({username})

        if(!user){
            throw new BadRequestError("Sorry, Username or Password is not correct")
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch){
            throw new BadRequestError("Sorry, Username or password is not correct")
        }


        const {accessToken, refreshToken} = this.createTokens({userId: user.user_id})
        await this.submitRefreshToken(refreshToken, res)


        res.status(200).json({
            message: "successfully logged in",
            accessToken: accessToken,
            userId: user.user_id,
            username: user.username
        })
    })


    refreshToken = asyncWrapper( async (req, res) => {

        const currentRefreshToken = req.cookies.refreshToken
        if(!currentRefreshToken){
            throw new UnauthorizedError("You dont have a token")
        }

        const payload = jwt.verify(currentRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        // get user by Payload's id
        const user = await this.getUserByFilter({user_id: payload.userId})
        if(!user){
            throw new UnauthorizedError("Unauthorized error")
        }
        const {accessToken, refreshToken} = this.createTokens({userId: user.user_id})
        await this.submitRefreshToken(refreshToken, res)
    
        return res.status(200).json({
            accessToken,
            userId: user.user_id
        })
    })


    logout = asyncWrapper (async (req, res) => {
        res.clearCookie("refreshToken")
        res.status(200).json({
            message: "cookie cleared",
        })
    })
}

module.exports = new Auth()