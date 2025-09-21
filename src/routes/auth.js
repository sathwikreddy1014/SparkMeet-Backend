const express = require("express");
const { validateSignupData } = require("../utils/validatesignup");
const User = require("../models/user");

const authRouter = express.Router();

// === SIGNUP ===
authRouter.post("/signup", async (req, res) => {
  try {
    // Validate request
    validateSignupData(req);

    const { password, firstName, lastName, emailId, age, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User already exists with this email." });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      emailId,
      password, // will be hashed in pre-save hook
      age,
      gender,
    });

    const savedUser = await user.save();

     // Generate JWT
    const token = savedUser.generateJWT();

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res
      .status(201).json({message: "SignedUp Sucessfully ", data: savedUser})
  } catch (err) {
    res.status(400).json({ error: "Signup error: " + err.message });
  }
});

// === LOGIN ===
authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    
    const userOne = await User.findOne({ emailId });
    if (!userOne) {
      return res.status(401).json({ error: "INVALID EMAIL OR PASSWORD." });
    }

    // Verify password
    const isPasswordValid = await userOne.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "INVALID EMAIL OR PASSWORD." });
    }

    // Generate JWT
    const token = userOne.generateJWT();

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Prepare safe user object
    const user = userOne.toObject();
    delete user.password;

    res.json({ data: user , message: "Login successful" });
  } catch (err) {
    res.status(500).json({ error: "Login error: " + err.message });
  }
});

// === LOGOUT ===
authRouter.post("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).json({ message: "Logged out successfully." });
});

module.exports = authRouter;
