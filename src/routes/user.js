const express = require('express');
const { userAuth } = require('../middlewares/adminAuth');
const ConnectionRequest = require('../models/connectionRequest');
const User = require('../models/user');
const userRouter = express.Router();

// Only expose safe fields from User to the client
const USER_SAFE_DATA = ["firstName", "lastName", "age", "gender", "photoUrl","about"];

/**
 * GET /user/requests/received
 */
userRouter.get('/user/requests/received', userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        // Find all requests where current user is the target
        const connectionRequest = await ConnectionRequest.find({
            touserId: loggedInUser._id,
            status: "like"
        })
        // Populate sender details with safe fields only
        .populate("fromuserId", USER_SAFE_DATA);

        res.json({
            message: "Data fetched successfully",
            data: connectionRequest
        });

    } catch (err) {
        res.status(400).send("ERROR: " + err.message);
    }
});

/**
 * GET /user/connections
 */

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Fetch all accepted connections where user is sender or receiver
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromuserId: loggedInUser._id, status: "accepted" },
        { touserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromuserId", USER_SAFE_DATA)
      .populate("touserId", USER_SAFE_DATA);

    // Filter out any connection requests where either user is missing
    const validConnections = connectionRequests.filter(
      (row) => row.fromuserId && row.touserId
    );

    // Map to return the "other" user in each connection
    const connectionsData = validConnections.map((row) => {
      if (row.fromuserId._id.toString() === loggedInUser._id.toString()) {
        return row.touserId; // current user is sender → return receiver
      }
      return row.fromuserId; // current user is receiver → return sender
    });

    res.json({ data: connectionsData });
  } catch (err) {
    console.error("ERROR in /user/connections:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

module.exports = userRouter;


/**
 * GET /feed
 */
userRouter.get('/feed', userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        let limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1 ) * limit;
        limit = limit > 50 ? 50 : limit;
        // Find all requests where current user is involved
        const connectionRequests = await ConnectionRequest.find({
            $or: [
                { fromuserId: loggedInUser._id },
                { touserId: loggedInUser._id }
            ]
        }).select("fromuserId touserId");

        // Collect userIds that should be hidden from feed
        const hideUsersFromFeed = new Set();
        connectionRequests.forEach(request => {
            hideUsersFromFeed.add(request.fromuserId.toString());
            hideUsersFromFeed.add(request.touserId.toString());
        });

        // Also hide the logged-in user themselves
        hideUsersFromFeed.add(loggedInUser._id.toString());

        // Fetch all users excluding the above list
        const users = await User.find({
            _id: { $nin: Array.from(hideUsersFromFeed) }
        }).select(USER_SAFE_DATA).skip(skip).limit(limit);

        res.status(200).json({ success: true, length : users.length ,data:users });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = userRouter;
