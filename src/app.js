const express = require('express')
const authRouter = require('./routes/auth.routes')
const cookieParser = require('cookie-parser')
const app = express()  //server create karne ke liye express ka use karenge, app variable me express ka instance store karenge
const accountRouter = require('./routes/account.routes')
const transactionRouter = require('./routes/transaction.routes')

app.use(express.json())  //ye middleware hai jo incoming request ke body ko json format me convert karega

app.use(cookieParser())  //ye middleware hai jo incoming request ke cookies ko parse karega aur unko req.cookies me store karega

app.use("/api/auth", authRouter)  //jinki starting /api/auth se hogi unko authRouter handle karega
app.use("/api/accounts", accountRouter)  //jinki starting /api/accounts se hogi unko accountRouter handle karega
app.use("/api/transactions", transactionRouter)  //jinki starting /api/transactions se hogi unko transactionRouter handle karega

module.exports = app