const authAPI = require("../api/auth.js")
const router = require("express").Router()

router.post('/signup', authAPI.signup)
router.post('/login', authAPI.login)
router.post('/refresh_token', authAPI.refreshToken)
router.post('/logout', authAPI.logout)


module.exports  = router
