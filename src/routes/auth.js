const express = require("express");
const { validateSignupData } = require("../utils/validatesignup");
const User = require("../models/user");
const ApiError = require("../utils/apiError.js");
const ApiResponse = require("../utils/ApiResponse");

const authRouter = express.Router();

// === SIGNUP ===
authRouter.post("/api/auth/signup", async (req, res, next) => {
  try {
    validateSignupData(req);

    const { password, firstName, lastName, emailId, age, gender } = req.body;

    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      throw new ApiError(400, "User already exists with this email.");
    }

    const user = new User({
      firstName,
      lastName,
      emailId,
      password,
      age,
      gender,
    });

    const savedUser = await user.save();

    const token = savedUser.generateJWT();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, savedUser, "Signed up successfully"));
  } catch (err) {
    next(err);
  }
});

// === LOGIN ===
authRouter.post("/api/auth/login", async (req, res, next) => {
  try {
    const { emailId, password } = req.body;

    const userOne = await User.findOne({ emailId });
    if (!userOne) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await userOne.verifyPassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = userOne.generateJWT();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    const user = userOne.toObject();
    delete user.password;

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Login successful"));
  } catch (err) {
    next(err);
  }
});

// === LOGOUT ===
authRouter.post("/api/auth/logout", (req, res, next) => {
  try {
    res.cookie("token", null, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Logged out successfully"));
  } catch (err) {
    next(err);
  }
});

module.exports = authRouter;
