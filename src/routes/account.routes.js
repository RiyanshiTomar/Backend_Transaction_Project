const express = require('express')

const authMiddleware = require('../middleware/auth.middleware')

const accountController = require('../controller/account.controller')

const router = express.Router()

//post api--create a new account
router.post('/account', authMiddleware.authMiddleware, accountController.createAccountController)

//get accounts
router.get('/accounts', authMiddleware.authMiddleware, accountController.getAccountsController)

//get /api/accounts/balance--get balance of all accounts of a user (account id)
router.get('/accounts/account/:accountId', authMiddleware.authMiddleware, accountController.getBalanceController)




module.exports = router