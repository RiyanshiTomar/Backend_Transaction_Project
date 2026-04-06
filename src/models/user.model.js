const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],   //validation for email format---regex pattern
        unique: [true, 'Email already exists']

    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true

    },

    password: {
        type: String,
        required: [true, 'Password is required for creating an account'],
        minlength: [6, 'Password must be at least 6 characters long'],
        maxlength: [128, 'Password cannot exceed 128 characters'],
        select: false  //to exclude password field from query results by default
    },
    systemUser:{
        type: Boolean,
        default: false , //by default, jab bhi koi user create hoga to uska systemUser field false hoga, iska matlab hai ki ye user ek normal user hai, agar hum kisi user ka systemUser field true kar denge to uska matlab hai ki wo user ek system user hai, jiska use hum internal operations ke liye kar sakte hain, jaise ki automated processes ya background tasks ke liye
        immutable: true,  //systemUser field create hone ke baad usko change nahi kiya ja sakta, iska matlab hai ki agar koi user system user ke roop me create hua hai to wo hamesha system user hi rahega, aur agar koi user normal user ke roop me create hua hai to wo hamesha normal user hi rahega
        select: false  //to exclude systemUser field from query results by default, kyunki hume systemUser field ke basis pe queries karne ki zarurat nahi padti, aur agar hum is field ko select nahi karenge to queries thodi fast ho jayengi, aur security bhi badhegi, kyunki agar koi attacker database me access kar leta hai to usko pata nahi chalega ki kaunse users system users hain aur kaunse normal users hain
     }
    }
, {
    timestamps: true //user ka account kab create hua aur kab update hua---automatically created by mongoose
})

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return
    }
    //hash the password before saving to the database
    const saltRounds = 10 //number of rounds to generate salt for hashing the password--the higher the number, the more secure the hash but also more time consuming
    this.password = await bcrypt.hash(this.password, saltRounds)}
    
)

const User = mongoose.model('User', userSchema)

module.exports = User
    