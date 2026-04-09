const express = require('express')
const router = express.Router()
const authController = require('../controller/auth.controller')


//post method k saath api api/auth/register 
router.post('/register', authController.userRegisterController)

//login
router.post('/login', authController.userLoginController)

//post /api/auth/logout
router.post('/logout', authController.userLogoutController)



module.exports = router
