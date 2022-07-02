const CustomError = require("./CustomError")
const {StatusCodes} = require("http-status-codes")


class UnauthorizedError extends CustomError {
    constructor(message){
        super(message, StatusCodes.UNAUTHORIZED)
    }
}

module.exports = UnauthorizedError