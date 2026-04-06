const mongoose = require('mongoose')

const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'Account is required'],
        index: true ,//taki queries fast ho jayengi jab hum account ke basis pe ledger entries ko query karenge
        immutable: true  //ledger entry create hone ke baad uska account change nahi ho sakta
    },
    amount:{
        type: Number,
        required: [true, 'Amount is required'],
        immutable: true  //ledger entry create hone ke baad uska amount change nahi ho sakta
    },
    transaction:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: [true, 'Transaction is required'],
        index: true, //taki queries fast ho jayengi jab hum transaction ke basis pe ledger entries ko query karenge
        immutable: true  //ledger entry create hone ke baad uska transaction change nahi ho sakta
     },
     type:{
        enum:{
            values: ['debit', 'credit'],
            message: 'Type must be either debit or credit'
            },
            type: String,
            required: [true, 'Type is required'],
            immutable: true  //ledger entry create hone ke baad uska type change nahi ho sakta
     }
    },{
        timestamps: true
     }
)

function preventLedgerModification(){
    throw new Error('Ledger entries cannot be modified or deleted')
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification)  //ledger entry update hone se pehle is function ko call karega, agar koi update karne ki koshish karega to usko error throw kar dega
ledgerSchema.pre('deleteOne', preventLedgerModification)  //ledger entry delete hone se pehle is function ko call karega, agar koi delete karne ki koshish karega to usko error throw kar dega
ledgerSchema.pre('deleteMany', preventLedgerModification)  //ledger entries delete hone se pehle is function ko call karega, agar koi delete karne ki koshish karega to usko error throw kar dega
ledgerSchema.pre('updateOne', preventLedgerModification)  //ledger entry update hone se pehle is function ko call karega, agar koi update karne ki koshish karega to usko error throw kar dega
ledgerSchema.pre('updateMany', preventLedgerModification)  //ledger entries update hone se pehle is function ko call karega, agar koi update karne ki koshish karega to usko error throw kar dega
ledgerSchema.pre('remove', preventLedgerModification)  //ledger entry remove hone se pehle is function ko call karega, agar koi remove karne ki koshish karega to usko error throw kar dega
ledgerSchema.pre('findOneAndDelete', preventLedgerModification)  //ledger entry findOneAndDelete hone se pehle is function ko call karega, agar koi findOneAndDelete karne ki koshish karega to usko error throw kar dega
ledgerSchema.pre('findOneAndReplace', preventLedgerModification)  //ledger entry findOneAndReplace hone se pehle is function ko call karega, agar koi findOneAndReplace karne ki koshish karega to usko error throw kar dega
ledgerSchema.pre('replaceOne', preventLedgerModification)  //ledger entry replace hone se pehle is function ko call karega, agar koi replace karne ki koshish karega to usko error throw kar dega
ledgerSchema.pre('findOneAndUpdate', preventLedgerModification)  //ledger entry findOneAndUpdate hone se pehle is function ko call karega, agar koi findOneAndUpdate karne ki koshish karega to usko error throw kar dega

const Ledger = mongoose.model('Ledger', ledgerSchema)

module.exports = Ledger