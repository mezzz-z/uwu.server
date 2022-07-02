const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors/CustomError')
const {JsonWebTokenError} = require("jsonwebtoken")


module.exports = (err, req, res, next) => {
    console.log(err)
    let statusCode = 500

    if(err instanceof CustomError){
        statusCode = err.statusCode
    }

    if(err instanceof JsonWebTokenError){
        statusCode = StatusCodes.UNAUTHORIZED
    }
    
    res.status(statusCode).json({
        message: err.message
    })
}