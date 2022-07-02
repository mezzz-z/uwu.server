const CustomError = require("./CustomError")
const {StatusCodes} = require("http-status-codes")


class ForbiddenError extends CustomError {
    constructor(){
        super("Sorry, You dont have access to do that", StatusCodes.FORBIDDEN)
    }
}

module.exports = ForbiddenError