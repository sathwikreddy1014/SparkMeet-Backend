const express = require('express');
const multer = require('multer');
const { userAuth } = require("../middlewares/adminAuth.js");
const { validatePassword } = require('../utils/validatepassword.js');
const PasswordReset = require('../models/passwordReset.js');
const nodemailer = require('nodemailer');
const User = require('../models/user.js');
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const { uploadOnCloudinary, deleteFromCloudinary } = require("../utils/cloudinary.js");

const profileRouter = express.Router();


const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// === Multer Setup for Images (1–6) ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Use absolute path here
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per image
});

// === PROFILE VIEW ===
profileRouter.get('/profile/view', userAuth, async (req, res, next) => {
  try {
    const user = req.user.toObject();
    delete user.password; // Remove sensitive field
    res.json(new ApiResponse(200, user, "Profile fetched successfully"));
  } catch (err) {
    next(err);
  }
});

// PATCH - Update profile info (without photos)
profileRouter.patch(
  "/profile/edit",
  userAuth,
  async (req, res, next) => {
    try {
      const updateData = req.body;

      // Clean empty fields
      Object.keys(updateData).forEach((key) => {
        if (
          updateData[key] === null ||
          updateData[key] === "" ||
          (Array.isArray(updateData[key]) && updateData[key].length === 0)
        ) {
          delete updateData[key];
        }
      });

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedUser) return next(new ApiError(404, "User not found"));

      res.json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
    } catch (err) {
      next(err);
    }
  }
);

// POST - Upload new photos and push them into DB
profileRouter.post(
  "/profile/upload-photos",
  userAuth,
  upload.array("images", 6),
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedUrls = [];
      for (const file of req.files) {
        const uploadedImageUrl = await uploadOnCloudinary(file.path);
        if (uploadedImageUrl?.secure_url) {
          uploadedUrls.push(uploadedImageUrl.secure_url);
        }
      }

      // ✅ Push all new URLs into user's photoUrl array
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $push: { photoUrl: { $each: uploadedUrls } } }, // <-- use $each
        { new: true }
      );

      res.json(new ApiResponse(200, updatedUser, "Photos uploaded successfully"));
    } catch (err) {
      next(err);
    }
  }
);

// DELETE - Remove one photo
profileRouter.delete(
  "/profile/remove-photo",
  userAuth,
  async (req, res, next) => {
    try {
      const { url } = req.body;
      if (!url) return next(new ApiError(400, "No photo URL provided"));

      // Remove from Cloudinary
      await deleteFromCloudinary(url);

      // Pull from MongoDB
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { photoUrl: url } },
        { new: true }
      );

      res.json(new ApiResponse(200, updatedUser, "Photo removed successfully"));
    } catch (err) {
      next(err);
    }
  }
);




// === PASSWORD EDIT ===
profileRouter.patch('/profile/password', userAuth, async (req, res, next) => {
  try {
    await validatePassword(req);
    const currentUser = req.user;
    const { newPassword } = req.body;

    if (!newPassword) {
      return next(new ApiError(400, "New password is required"));
    }

    currentUser.password = newPassword;
    await currentUser.save();

    res.json(
      new ApiResponse(
        200,
        null,
        `The password for '${currentUser.emailId}' has been updated successfully.`
      )
    );
  } catch (err) {
    next(err);
  }
});

// === FORGOT PASSWORD ===
profileRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { emailId } = req.body;
    const user = await User.findOne({ emailId });

    const message = "If an account exists with this email, you will receive a verification code.";

    if (!user) return res.json(new ApiResponse(200, null, message));

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    await PasswordReset.deleteMany({ emailId });
    await PasswordReset.create({
      emailId,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: emailId,
      subject: "Your Password Verification Code",
      html: `<p>Your verification code is: <b>${otp}</b></p>`,
    });

    res.cookie("resetEmail", emailId, { httpOnly: true, sameSite: "strict" });
    res.json(new ApiResponse(200, null, message));
  } catch (error) {
    next(error);
  }
});

// === VERIFY RESET CODE ===
profileRouter.post("/verify-reset-code", async (req, res, next) => {
  try {
    const { emailId, otp } = req.body;
    const record = await PasswordReset.findOne({ emailId, otp });

    if (!record || record.expiresAt < new Date()) {
      return next(new ApiError(400, "Invalid or expired code"));
    }

    await PasswordReset.deleteMany({ emailId });
    res.cookie("resetToken", emailId, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 5 * 60 * 1000,
    });

    res.json(new ApiResponse(200, null, "Code verified successfully"));
  } catch (err) {
    next(err);
  }
});

// === RESET PASSWORD ===
profileRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return next(new ApiError(400, "Please enter a password"));
    }

    const emailId = req.cookies.resetToken;
    if (!emailId) {
      return next(new ApiError(401, "Not authorized to reset password"));
    }

    const user = await User.findOne({ emailId });
    if (!user) return next(new ApiError(404, "User not found"));

    user.password = newPassword;
    await user.save();

    res.clearCookie("resetToken");
    res.clearCookie("resetEmail");

    res.json(new ApiResponse(200, null, "Password reset successful"));
  } catch (error) {
    next(error);
  }
});

module.exports = profileRouter;
