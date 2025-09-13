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
profileRouter.patch('/profile/edit', userAuth, async (req, res) => {
    try {
        const validation = validateProfileData(req);
        if (!validation.valid) {
            throw new Error("request while editing: " + validation.message);
        }

        const loggedInUser = req.user
        
        Object.keys(req.body).forEach(key => (loggedInUser[key] = req.body[key]));

        await loggedInUser.save();

        res.json({
            message: `The user with email '${loggedInUser.emailId}' has been updated successfully.`,
            data: loggedInUser
        });
        
    } catch (error) {
    res.status(400).send("ERROR WHILE EDITING: " + error.message)
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
profileRouter.post('/forgotpassword', async (req, res) => {
    
  try {
      const { emailId } = req.body;
  
      const user = await User.findOne({ emailId });
  
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const code = String(Math.floor(100000 + Math.random() * 900000)).padStart(6, "0");

      await PasswordReset.deleteMany({ emailId });
      await PasswordReset.create({
          emailId,
          code, 
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
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
        We received a request to change your account password. Please enter the verification code below to continue:
      </p>

      <div style="background-color: #f1f3f4; padding: 14px 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; margin: 20px auto; border-radius: 4px; color: #202124; width: fit-content; min-width: 120px;">
        ${code}
      </div>

      <p style="color: #5f6368; font-size: 13px; text-align: center;">
        This code will expire in <strong>10 minutes</strong>.
      </p>

      <p style="color: #5f6368; font-size: 13px; text-align: center;">
        If you didn’t request this change, you can safely ignore this email or contact our support team.
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;">

      <p style="color: #5f6368; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Tinder. All rights reserved.
      </p>
    </div>
  `
});

      res.cookie("resetEmail", emailId, { httpOnly: true, sameSite: "strict" });
      res.json({ message: "OTP sent to your email" });
  
  } catch (error) {
     res.status(500).json({ message: "Server error", error: error.message });
  }
});
//=== RESET CODE ===//
profileRouter.post("/verify-reset-code", async (req, res) => {
  const { emailId, code } = req.body;
  const record = await PasswordReset.findOne({ emailId, code });

  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }
  await PasswordReset.deleteMany({ emailId });
  res.cookie("resetToken", emailId, { httpOnly: true, sameSite: "strict", maxAge: 5 * 60 * 1000 });
  res.json({ message: "Code verified" });
});
//  Reset Password
profileRouter.post("/reset-password", async (req, res) => {
  const { newPassword } = req.body;
  const emailId = req.cookies.resetToken;
  if (!emailId) return res.status(400).json({ message: "Not authorized to reset password" });

  const user = await User.findOne({ emailId });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = newPassword; // plain text, pre-save hook will hash
  await user.save();

  res.clearCookie("resetToken");
  res.clearCookie("resetEmail");
  res.json({ message: "Password reset successful" });
});


module.exports = profileRouter;
