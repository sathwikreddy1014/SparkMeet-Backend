const express = require('express');
const { userAuth } = require('../middlewares/adminAuth');
const ConnectionRequest = require('../models/connectionRequest');
const User = require('../models/user');
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const userRouter = express.Router();

// Only expose safe fields from User to the client
const USER_SAFE_DATA = [
  "firstName","lastName","age","gender","photoUrl","height","createdAt",
  "education","occupation","belief","preferredAgemin","preferredAgemax",
  "distancePreference","lookingFor","drinking","smoking","diet","languages",
  "sports","travelPreferences","pets"
];

/**
 * GET /user/requests/received
 */
userRouter.get("/user/requests/received", userAuth, async (req, res, next) => {
  try {
    const loggedInUser = req.user._id;

    const requests = await ConnectionRequest.find({  
      touserId: loggedInUser,
      status: "like"
    })
    .populate("fromuserId", "firstName lastName age gender photoUrl  location height education occupation beliefs languages lookingFor  hobbies favoriteMovies favoriteMusic sports travelPreferences pets drinking smoking diet")
    .lean();

    const validRequests = requests.filter(req => req.fromuserId !== null);

    res.json(new ApiResponse(200, validRequests, "Received requests fetched successfully"));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /user/connections
 */
userRouter.get("/user/connections", userAuth, async (req, res, next) => {
  try {
    const loggedInUser = req.user;

    if (!loggedInUser) {
      return next(new ApiError(401, "User not authenticated"));
    }

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromuserId: loggedInUser._id, status: "accepted" },
        { touserId: loggedInUser._id, status: "accepted" },
      ],
    })
    .populate("fromuserId", USER_SAFE_DATA)
    .populate("touserId", USER_SAFE_DATA);

    const validConnections = connectionRequests.filter(
      row => row.fromuserId && row.touserId
    );

    const connectionsData = validConnections.map(row => 
      row.fromuserId._id.toString() === loggedInUser._id.toString()
        ? row.touserId
        : row.fromuserId
    );

    res.json(new ApiResponse(200, connectionsData, "Connections fetched successfully"));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /feed
 */
userRouter.get('/feed', userAuth, async (req, res, next) => {
  try {
    const loggedInUser = req.user;

    let limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    limit = Math.min(limit, 50);

    // Find all requests where current user is involved
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { fromuserId: loggedInUser._id },
        { touserId: loggedInUser._id }
      ]
    }).select("fromuserId touserId");

    const hideUsersFromFeed = new Set();
    connectionRequests.forEach(request => {
      hideUsersFromFeed.add(request.fromuserId.toString());
      hideUsersFromFeed.add(request.touserId.toString());
    });
    hideUsersFromFeed.add(loggedInUser._id.toString());

    const candidates = await User.find({
      _id: { $nin: Array.from(hideUsersFromFeed) }
    }).select(USER_SAFE_DATA);

    const overlap = (arr1, arr2) => (arr1 && arr2 ? arr1.filter(item => arr2.includes(item)).length : 0);

    const scored = candidates.map(candidate => {
      let score = 0;
      score += overlap(loggedInUser.hobbies, candidate.hobbies) * 2;
      score += overlap(loggedInUser.favoriteMovies, candidate.favoriteMovies);
      score += overlap(loggedInUser.favoriteMusic, candidate.favoriteMusic);
      score += overlap(loggedInUser.sports, candidate.sports);
      score += overlap(loggedInUser.travelPreferences, candidate.travelPreferences);

      if (loggedInUser.drinking?.toString() === candidate.drinking?.toString()) score += 2;
      if (loggedInUser.smoking?.toString() === candidate.smoking?.toString()) score += 2;
      if (loggedInUser.diet?.toString() === candidate.diet?.toString()) score += 2;

      return { candidate, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const paged = scored.slice(skip, skip + limit);

    res.json(new ApiResponse(
      200,
      paged.map(item => ({ ...item.candidate._doc, matchScore: item.score })),
      "Feed fetched successfully"
    ));
  } catch (err) {
    next(err);
  }
});

module.exports = userRouter;
