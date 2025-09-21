const express = require('express');
const mongoose = require('mongoose');
const { userAuth } = require("../middlewares/adminAuth.js");
const ConnectionRequest = require('../models/connectionRequest.js');
const User = require('../models/user.js');

const requestRouter = express.Router();

/**
 * POST /request/send/:status/:touserId
 */
requestRouter.post(
  '/request/send/:status/:touserId',
  userAuth,
  async (req, res) => {
    try {
      const fromuserId = req.user._id;
      const touserId = req.params.touserId;
      const status = req.params.status;

      const allowedStatus = ['like', 'pass'];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: `Invalid status ${status}` });
      }

      if (!mongoose.Types.ObjectId.isValid(touserId)) {
        return res.status(400).json({ message: `User Not Found` });
      }

      const user = await User.findById(touserId);
      if (!user) {
        return res.status(400).json({ message: `User Not Found` });
      }

      // Prevent duplicate requests
      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromuserId, touserId },
          { fromuserId: touserId, touserId: fromuserId }
        ]
      });

      if (existingConnectionRequest) {
        return res.status(400).json({ message: `Connection Request Already Exists` });
      }

      const connectionRequest = new ConnectionRequest({
        fromuserId,
        touserId,
        status
      });

      const data = await connectionRequest.save();

      const actionWord = status === 'like' ? 'liked' : 'passed on';
      const displayName = user.firstName ? user.firstName : 'the user';

      res.json({
        message: `You have ${actionWord} ${displayName}`,
        data
      });

    } catch (error) {
      res.status(400).send('ERROR: ' + error.message);
    }
  }
);

/**
 * POST /request/review/:status/:requestId
 */
requestRouter.post(
  '/request/review/:status/:requestId',
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;

      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: `this type of status '${status}' is not allowed` });
      }

      // Find only LIKE requests that belong to the logged-in user
      const connectionRequest = await ConnectionRequest.findOne({
        _id: requestId,
        touserId: loggedInUser._id,
        status: "like"
      });

      if (!connectionRequest) {
        return res.status(404).json({ message: `Connection request not found` });
      }

      connectionRequest.status = status;
      const data = await connectionRequest.save();

      res.json({
        message: `Status updated successfully → ${status}`,
        data
      });

    } catch (error) {
      res.status(400).send('ERROR : ' + error.message);
    }
  }
);

module.exports = requestRouter;
