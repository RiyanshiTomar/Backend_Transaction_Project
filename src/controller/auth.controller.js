const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
require("dotenv").config(); //to load environment variables from .env file
//user registered controller function and it will handle the registration logic for the user, /api/auth/register pe request aayegi to ye function usko handle karega
const bcrypt = require("bcrypt");
const emailService = require("../email.service");

async function userRegisterController(req, res) {
  const { email, name, password } = req.body;

  const isExists = await userModel.findOne({ email: email }); //database me check karega ki email already exist karta hai ya nahi

  if (isExists) {
    return res.status(400).json({ message: "User already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10); //password ko hash karega before saving to the database, 10 is the number of rounds to generate salt for hashing the password--the higher the number, the more secure the hash but also more time consuming

  const user = await userModel.create({
    email,
    password: hashedPassword,
    name,
  });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  }); //jwt token generate karega user ke id se aur secret key se, aur token 3 din ke liye valid hoga

  res.cookie("token", token);

  res.status(201).json({
    //201 means when we are creating some resource in the database, then we use 201 status code
    message: "User registered successfully",
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });

  await emailService.sendRegistrationEmail(user.email, user.name); //registration ke baad user ko welcome email bhejega
}

async function userLoginController(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email: email }).select("+password"); //database me check karega ki email exist karta hai ya nahi, aur password field ko bhi select karega

  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password); //password ko compare karega database me stored password se

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  }); //jwt token generate karega user ke id se aur secret key se, aur token 3 din ke liye valid hoga

  res.cookie("token", token);
  res.status(200).json({
    //200 means hamne login kiya h, 201 means hamne register kiya h
    message: "User logged in successfully",
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
}

// async function getAccountsController(req, res) {
//   const accounts = await accountModel.find({ user: req.user._id }); //database me se user ke accounts ko find karega, jisme user field req.user._id ke barabar hoga, req.user me user ka data store hai jo authMiddleware me set kiya gaya hai

//   res.status(200).json({ accounts });
// }

async function userLogoutController(req, res) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; //token ko cookies se ya headers se get karega, agar token cookies me nahi hai to headers me authorization field me se get karega, j


  if(!token){
    return res.status(200).json({ message: "User not logged in" });
  }

  res.clearCookie("token"); //token cookie ko clear karega, jisse user logout ho jayega

  await tokenBlacklistModel.create({ token }); //token ko blacklist me add karega, jisse wo token future me valid nahi hoga, isse security badh jayegi kyunki agar kisi ne user ka token chura liya hai to wo token blacklist me hone ki wajah se use nahi kar paega

  res.status(200).json({ message: "User logged out successfully" });

}

module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
};

