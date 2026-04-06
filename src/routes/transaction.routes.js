const { Router } = require('express')
const authMiddleware = require('../middleware/auth.middleware')
const transactionController = require('../controller/transaction.controller')


const transactionRoutes  = Router()

//api/transaction--new transaction create karne ke liye
transactionRoutes.post('/transaction', authMiddleware.authMiddleware, transactionController.createTransaction)


//post api/transaction/system/initial-funds
//Create initial funds transaction for a system 
transactionRoutes.post('/transaction/system/initial-funds', authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)




module.exports = transactionRoutes