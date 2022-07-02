const UnauthorizedError = require("../errors/UnauthorizedError")
const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {

    const {authorization} = req.headers
    if(!authorization || !authorization.startsWith("Bearer ")){
        throw new UnauthorizedError("Unauthorized error")
    }

    const accessToken = authorization.split("Bearer ")[1]
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

    req.user = payload
    next()
}