const mongoose = require('mongoose')
const ledgerModel = require('./ledger.model')

const accountSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
        index: true    //b+ tree ka use karke user field pe index create karega, jisse queries fast ho jayengi
    },
    status:{
        enum:{
            values: ['active', 'inactive', 'suspended'],
            message: 'Status must be either active, inactive or suspended'
         },
         type: String,
         default: 'active'
     },
     currency:{
        type: String,
        required: [true, 'Currency is required'],
        default: "INR"
     }
    },{
        timestamps: true

    }
)

accountSchema.index({user:1, status:1}) //compound index create karega user aur status field pe, jisse queries fast ho jayengi jab hum user aur status ke basis pe accounts ko query karenge

accountSchema.methods.getBalance =  async function()
{
    //aggergation pipeline ka use karke ledger collection me se is account ke liye saari entries ko get karega aur unka amount calculate karega, jisse hume is account ka current balance mil jayega
    const balanceData = await ledgerModel.aggregate([
        {
            $match: {account: this._id}
        },
        {
            $group:{
                _id:null,
                totalDebit:{
                    $sum:{
                        $cond:[
                            {$eq: ['$type', 'debit']},
                            '$amount',
                            0
                        ]
                    }
                },
                totalCredit:{
                    $sum:{
                        $cond:[
                            {$eq: ['$type', 'credit']},
                            '$amount',
                            0
                        ]
                    }
                }
            }
        },
        {
            $project:{
                _id:0,
                balance: {$subtract: ['$totalCredit', '$totalDebit']}  //balance calculate karne ke liye total credit me se total debit ko subtract karenge
            }
        }
    ])
    if(balanceData.length > 0){  //agar balanceData array me data hai to uska balance return karenge, agar nahi hai to 0 return karenge, iska matlab hai ki is account ke liye abhi tak koi transaction nahi hua hai, isliye balance 0 hoga
        return 0
    }
    return balanceData[0].balance

}
const Account = mongoose.model('Account', accountSchema)

module.exports = Account