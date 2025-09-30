const express = require("express");
const ChatRoom = require("../models/chatroom.js");
const Message = require("../models/message.js");
const { userAuth } = require("../middlewares/adminAuth.js");
const ApiError = require("../utils/apiError.js");

const chatrouter = express.Router();

// Get or create chat room
chatrouter.post("/room", userAuth, async (req, res, next) => {
  try {
    const { userId } = req.body; // the other userId
    const currentUserId = req.user._id;

    if (!userId) {
      return next(new ApiError(400, "UserId is required"));
    }

    // find or create chat room
    let room = await ChatRoom.findOne({
      participants: { $all: [currentUserId, userId] },
    });

    if (!room) {
      room = await ChatRoom.create({
        participants: [currentUserId, userId],
      });
    }

    res.json(room);
  } catch (error) {
    next(error); // ✅ delegate to global error handler
  }
});

// Get messages of a room
chatrouter.get("/messages/:roomId", userAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return next(new ApiError(400, "Room ID is required"));
    }

    const messages = await Message.find({ chatRoom: roomId })
      .populate("sender", "firstName lastName photoUrl")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    next(error); // ✅ delegate
  }
});

// Send message
chatrouter.post("/message", userAuth, async (req, res, next) => {
  try {
    const { roomId, text } = req.body;

    if (!roomId || !text) {
      return next(new ApiError(400, "roomId and text are required"));
    }

    const message = await Message.create({
      chatRoom: roomId,
      sender: req.user._id,
      text,
    });

    // populate sender info
    await message.populate("sender", "firstName lastName photoUrl");

    res.json(message);
  } catch (error) {
    next(error); // ✅ delegate
  }
});

module.exports = chatrouter;
