const express = require('express');
const mongoose = require('mongoose');
const { userAuth } = require("../middlewares/adminAuth.js");
const ConnectionRequest = require('../models/connectionRequest.js');
const User = require('../models/user.js');
const ApiError = require("../utils/apiError.js");
const ApiResponse = require("../utils/ApiResponse.js");

const requestRouter = express.Router();

/**
 * POST /request/send/:status/:touserId
 */
requestRouter.post('/request/send/:status/:touserId', userAuth, async (req, res, next) => {
  try {
    const fromuserId = req.user._id;
    const touserId = req.params.touserId;
    const status = req.params.status;

    const allowedStatus = ['like', 'pass'];
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
        { fromuserId: touserId, touserId: fromuserId }
      ]
    });

    if (existingConnectionRequest) {
      return next(new ApiError(400, `Connection Request Already Exists`));
    }

    const connectionRequest = new ConnectionRequest({
      fromuserId,
      touserId,
      status
    });

    const data = await connectionRequest.save();

    const actionWord = status === 'like' ? 'liked' : 'passed on';
    const displayName = user.firstName || 'the user';

    res.json(new ApiResponse(200, data, `You have ${actionWord} ${displayName}`));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /request/review/:status/:requestId
 */
requestRouter.post('/request/review/:status/:requestId', userAuth, async (req, res, next) => {
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
