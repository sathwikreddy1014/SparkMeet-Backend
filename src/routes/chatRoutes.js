// routes/chatRoutes.js
const express = require ("express");
const ChatRoom = require("../models/chatroom.js");
const Message = require ("../models/message.js");
const { userAuth } = require( "../middlewares/adminAuth.js");

const chatrouter = express.Router();

// Get or create chat room
chatrouter.post("/room", userAuth, async (req, res) => {
  try {

    const { userId } = req.body; // the other userId
    // console.log(userId);
    
    const currentUserId = req.user._id;

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
    res.status(500).json({ error: error.message });
  }
});

// Get messages of a room
chatrouter.get("/messages/:roomId", userAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ chatRoom: roomId })
      .populate("sender", "firstName lastName photoUrl")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
chatrouter.post("/message", userAuth, async (req, res) => {
  try {
    const { roomId, text } = req.body;
    const message = await Message.create({
      chatRoom: roomId,
      sender: req.user._id,
      text,
    });

    // populate sender info
    await message.populate("sender", "firstName lastName photoUrl");

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = chatrouter;
