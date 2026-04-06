const mongoose = require('mongoose')

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, 'Token is required'],
        index: true, //taki queries fast ho jayengi jab hum token ke basis pe blacklist entries ko query karenge
        unique: true  //token unique hona chahiye, taki ek hi token ko multiple times blacklist me add na kiya ja sake
    },
    // blacklistedAt: {
    //     type: Date,
    //     default: Date.now, //jab token blacklist me add kiya jata hai to uska blacklistedAt field current date and time se set ho jata hai
    //     expires: 60 * 60 * 24 * 7 //token blacklist me add hone ke 7 din baad automatically delete ho jayega, taki blacklist collection me purane tokens ka data na rahe
    // }
},{
    timestamps: true
})

tokenBlacklistSchema.index({createdAt: 1}, {expireAfterSeconds: 60 * 60 * 24 * 7}) //ye index create karega token field pe aur usko expireAfterSeconds option ke sath set karega, taki token blacklist me add hone ke 7 din baad automatically delete ho jayega

const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema)

module.exports = TokenBlacklist
