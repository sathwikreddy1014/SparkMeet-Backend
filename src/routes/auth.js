const express = require("express");
const { validateSignupData } = require("../utils/validatesignup");
const User = require("../models/user");


const authRouter = express.Router();

// === SIGNUP ===
authRouter.post('/signup', async (req, res) => {
    try {
        validateSignupData(req);

        const { password, firstName, lastName, emailId, age, gender } = req.body;

        const existingUser = await User.findOne({ emailId });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists with this email." });
        }

        const user = new User({
            firstName,
            lastName,
            emailId,
            password, // Plain password — will be hashed in the model
            age,
            gender
        });

        await user.save();

        res.status(201).json({ message: "Signup successful.", userId: user._id });
    } catch (err) {
        res.status(400).json({ error: "Signup error: " + err.message });
    }
});

// === LOGIN ===
authRouter.post('/login', async (req, res) => {
    try {
        const { emailId, password } = req.body;

        const userOne = await User.findOne({ emailId });
        if (!userOne) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const isPasswordValid = await userOne.verifyPassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = await userOne.generateJWT();

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });
        const user = userOne.toObject();
        delete user.password

        res.json({ message: user });
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
