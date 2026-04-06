const userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
require('dotenv').config()  //to load environment variables from .env file
const tokenBlacklistModel = require('../models/tokenBlacklist.model')

async function authMiddleware(req, res, next){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1] //token ko cookies se get karega

    if(!token){
        return res.status(401).json({message: "Unauthorized"})
    }

    const isBlacklisted = await tokenBlacklistModel.findOne({token: token})  //database me check karega ki token blacklist me hai ya nahi, agar token blacklist me hai to usko unauthorized response bhejega

    if(isBlacklisted){
        return res.status(401).json({message: "Unauthorized"})
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)  //token ko verify karega secret key se, agar token valid hai to decoded variable me userId milega
        const user = await userModel.findById(decoded.userId)  //database me user ko find karega userId se

        req.user = user  //req.user me user ka data store karega, jisse hum next middleware me use kar sakte hai
        return next()  //next middleware ko call karega

    }catch(err){
        return res.status(401).json({message: "Unauthorized"})
    }
}

async function authSystemUserMiddleware(req, res, next){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1] //token ko cookies se get karega
    
    if(!token){
        return res.status(401).json({message: "Unauthorized"})
    }

    const isBlacklisted = await tokenBlacklistModel.findOne({token: token})  //database me check karega ki token blacklist me hai ya nahi, agar token blacklist me hai to usko unauthorized response bhejega

    if(isBlacklisted){
        return res.status(401).json({message: "Unauthorized"})
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)  //token ko verify karega secret key se, agar token valid hai to decoded variable me userId milega
        const user = await userModel.findById(decoded.userId).select('+systemUser')  //database me user ko find karega userId se
        
        if(!user.systemUser){  //agar user ka systemUser field false hai to usko unauthorized response bhejega, kyunki ye middleware sirf system users ke liye hai
            return res.status(401).json({message: "Unauthorized"})
        }
        req.user = user  //req.user me user ka data store karega, jisse hum next middleware me use kar sakte hai
        return next()  //next middleware ko call karega
        
    }

    catch(err){
        return res.status(401).json({message: "Unauthorized"})
    }
}


module.exports = {
    authMiddleware

    , authSystemUserMiddleware}