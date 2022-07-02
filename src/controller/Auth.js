const jwt = require("jsonwebtoken")
const UsersController = require("./Users")

const defaultExpirationTime = 1000 * 60 * 60 * 24 * 7

module.exports = class AuthController extends UsersController {

    async submitRefreshToken(refreshToken, res){
        // store refresh token on cookies
        res.cookie("refreshToken", refreshToken, {
            maxAge: defaultExpirationTime,    // will be expired after 7 days
            httpOnly: true,
        })
    }

    createTokens(payload){
        const accessToken = 
        jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "1d"})
        const refreshToken =
        jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "7d"})

        return {accessToken, refreshToken}
    }
}