const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'From account is required']
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'To account is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount must be at least 0']
    },
    status: {
        enum: {
            values: ['pending', 'completed', 'failed'],
            message: 'Status must be either pending, completed or failed'
        },
        type: String,
        default: 'pending'  //phele ham pendig hi rakhte hain, jab transaction complete ho jaye to uska status change kar denge completed ya failed me se kisi ek me
    },
    idempotencyKey: {
        type: String,
        required: [true, 'Idempotency key is required'],
        index: true,
        unique: [true, 'Idempotency key must be unique']  //iske through hum ensure karenge ki same transaction multiple times execute na ho jaye, agar same idempotency key ke sath transaction request aayegi to usko reject kar denge
    }
}, {
    timestamps: true
})

const Transaction = mongoose.model('Transaction', transactionSchema)

module.exports = Transaction
