const express = require('express');
const mongoose = require('mongoose');
const { userAuth } = require("../middlewares/adminAuth.js");
const ConnectionRequest = require('../models/connectionRequest.js');
const User = require('../models/user.js');
const ApiError = require("../utils/apiError.js");
const ApiResponse = require("../utils/ApiResponse.js");
const {  run: sendEmail } = require("../utils/sendemail.js"); // ✅ fixed import

const requestRouter = express.Router();

/**
 * POST /request/send/:status/:touserId
 */
requestRouter.post("/send/:status/:touserId", userAuth, async (req, res, next) => {
  try {
    const fromuserId = req.user._id;
    const touserId = req.params.touserId;
    const status = req.params.status;

    const allowedStatus = ["like", "pass"];
    if (!allowedStatus.includes(status)) {
      return next(new ApiError(400, `Invalid status '${status}'`));
    }

    if (!mongoose.Types.ObjectId.isValid(touserId)) {
      return next(new ApiError(400, `User Not Found`));
    }

    const user = await User.findById(touserId);
    if (!user) {
      return next(new ApiError(404, `User Not Found`));
    }

    // Prevent duplicate requests
    const existingConnectionRequest = await ConnectionRequest.findOne({
      $or: [
        { fromuserId, touserId },
        { fromuserId: touserId, touserId: fromuserId },
      ],
    });

    if (existingConnectionRequest) {
      return next(new ApiError(400, `Connection Request Already Exists`));
    }

    // Create new connection request
    const connectionRequest = new ConnectionRequest({
      fromuserId,
      touserId,
      status,
    });

    const data = await connectionRequest.save();

    // Send email notification
    // try {
    //   console.log(`📧 Sending email to: ${user.emailId || "sathwik1014@gmail.com"}`);

    //   await sendSparkmeetEmail({
    //     toAddress: "sathwikreddy496@gmail.com", // ✅ fixed verified recipient
    //     fromAddress: "sparkmeet.team@gmail.com", // ✅ fixed verified sender
    //     subject: "💌 New Connection Request on SparkMeet!",
    //     htmlBody: `
    //       <h2>Hey ${user.firstName || "there"} 👋</h2>
    //       <p>Someone just <b>${status}</b> you on SparkMeet!</p>
    //       <p>Log in to your account to check the new connection.</p>
    //       <br/>
    //       <p>💖 With love,<br/>The SparkMeet Team</p>
    //     `,
    //   });

    //   console.log("✅ Email notification sent to sathwik1014@gmail.com");
    // } catch (emailError) {
    //   console.error("❌ Error sending email:", emailError.message);
    // }



  const emailRes = await sendEmail(
        "A new friend request from " + req.user.firstName,
        req.user.firstName + " is " + status + " in "
      );

     
    

    const actionWord = status === "like" ? "liked" : "passed on";
    const displayName = user.firstName || "the user";

    res.json(new ApiResponse(200, data, `You have ${actionWord} ${displayName}`));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /request/review/:status/:requestId
 */
requestRouter.post('/review/:status/:requestId', userAuth, async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    const { status, requestId } = req.params;

    const allowedStatus = ["accepted", "rejected"];
    if (!allowedStatus.includes(status)) {
      return next(new ApiError(400, `This type of status '${status}' is not allowed`));
    }

    // Find only LIKE requests that belong to the logged-in user
    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      touserId: loggedInUser._id,
      status: "like"
    });

    if (!connectionRequest) {
      return next(new ApiError(404, `Connection request not found`));
    }

    connectionRequest.status = status;
    const data = await connectionRequest.save();

    res.json(new ApiResponse(200, data, `Status updated successfully → ${status}`));
  } catch (error) {
    next(error);
  }
});

module.exports = requestRouter;
