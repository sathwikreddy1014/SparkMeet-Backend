const express = require('express');
const {userAuth} = require("../middlewares/adminAuth.js")
const { validateProfileData } = require('../utils/validateprofieldata.js');
const { validatePassword } = require('../utils/validatepassword.js');
const bcrypt = require('bcrypt');
const PasswordReset = require('../models/passwordReset.js');
const nodemailer = require('nodemailer');
const User = require('../models/user.js');
const profileRouter = express.Router();


//=== PROFILE VIEW ===//
profileRouter.get('/profile/view', userAuth, async (req, res) => {
    try {
        // req.user is already populated by userAuth middleware
        const user = req.user.toObject();
        delete user.password;  // remove sensitive field

        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
//=== PROFILE EDIT ===//
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    const updates = req.body;

    // remove empty/null fields so they don’t overwrite
    Object.keys(updates).forEach((key) => {
      if (
        updates[key] === null ||
        updates[key] === "" ||
        (Array.isArray(updates[key]) && updates[key].length === 0)
      ) {
        delete updates[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, // user from token
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
}); 


//=== PASWWORD EDIT ===//
profileRouter.patch('/profile/password', userAuth, async (req, res) => {
    try {
        await validatePassword(req); 
        const currentUser = req.user;
        const { newPassword } = req.body;

        currentUser.password = newPassword; 
        await currentUser.save(); 

        res.json({
            message: `The password for email '${currentUser.emailId}' has been updated successfully.`
        });
    } catch (err) {
        console.error("Password update error:", err.message);
        res.status(400).json({ error: err.message });
    }
});
//=== FORGET PASSWORD ===//
profileRouter.post('/forgot-password', async (req, res) => {
  try {

    const { emailId } = req.body;
    const user = await User.findOne({ emailId });
    if (!user) return res.status(200).json({ message: "If an account exists with this email, you will receive a verification code." });

    const otp = String(Math.floor(100000 + Math.random() * 900000)); // string

    await PasswordReset.deleteMany({ emailId });
    await PasswordReset.create({
      emailId,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: emailId,
      subject: "Your Password Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px; max-width: 500px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #202124; font-weight: normal; text-align: center;">Password Verification</h2>
          <p style="color: #202124; font-size: 14px; text-align: center;">
            Hello <strong>${user.firstName}</strong>,  
            <br><br>
            Your verification code:
          </p>
          <div style="background-color: #f1f3f4; padding: 14px 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px auto; border-radius: 4px; color: #202124; width: fit-content; min-width: 120px;">
            ${otp}
          </div>
          <p style="color: #5f6368; font-size: 13px; text-align: center;">
            This code will expire in <strong>10 minutes</strong>.
          </p>
        </div>
      `
    });

    res.cookie("resetEmail", emailId, { httpOnly: true, sameSite: "strict" });
    res.json({
      message:
        "If an account exists with this email, you will receive a verification code."
    });

  } catch (error) {
    console.error("Error in /forgot-password:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//=== RESET CODE ===//
profileRouter.post("/verify-reset-code", async (req, res) => {
  const { emailId, otp } = req.body;
  const record = await PasswordReset.findOne({ emailId, otp });

  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }
  await PasswordReset.deleteMany({ emailId });
  res.cookie("resetToken", emailId, { httpOnly: true, sameSite: "strict", maxAge: 5 * 60 * 1000 });
  res.json({ message: "Code verified" });
});
//  Reset Password
profileRouter.post("/reset-password", async (req, res) => {
  try {
    const { newPassword } = req.body;

    // Check if both passwords are provided
    if (!newPassword ) {
      return res.status(400).json({ message: "Plsease enetr password" });
    }

    // Check if passwords match


    // Get user from cookie
    const emailId = req.cookies.resetToken;
    if (!emailId) return res.status(400).json({ message: "Not authorized to reset password" });

    const user = await User.findOne({ emailId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update password (assuming pre-save hook hashes it)
    user.password = newPassword;
    await user.save();

    // Clear reset cookies
    res.clearCookie("resetToken");
    res.clearCookie("resetEmail");

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error("Error in /reset-password:", error);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = profileRouter;
