const express = require('express');
const { userAuth } = require('../middlewares/adminAuth');
const ConnectionRequest = require('../models/connectionRequest');
const User = require('../models/user');
const userRouter = express.Router();

// Only expose safe fields from User to the client
const USER_SAFE_DATA = ["firstName", "lastName", "age", "gender", "photoUrl","height","createdAt","education", "occupation",
    "belief",
    "preferredAgemin",
    "preferredAgemax",
    "distancePreference",
    "lookingFor",
    "drinking",
    "smoking",
    "diet",
    "languages",
    "sports",
    "travelPreferences",
    "pets", ];

/**
 * GET /user/requests/received
 */
// Example route in your backend
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user._id; // however you get the logged-in user
    //console.log(loggedInUser);
    
    
    const requests = await ConnectionRequest.find({  
  touserId: loggedInUser._id,
  status: "like"   // ✅ only fetch liked ones
})
.populate("fromuserId", "firstName lastName age gender photoUrl about")
.lean();


    // ✅ Filter out requests where fromuserId is null
    const validRequests = requests.filter((req) => req.fromuserId !== null);

    res.json({ data: validRequests });
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ error: "Internal server error" });
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
    const skip = (page - 1) * limit;
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
    hideUsersFromFeed.add(loggedInUser._id.toString());

    // Base candidate pool
    const candidates = await User.find({
      _id: { $nin: Array.from(hideUsersFromFeed) },
    }).select(USER_SAFE_DATA);

    // Scoring function
    const overlap = (arr1, arr2) => {
      if (!arr1 || !arr2) return 0;
      return arr1.filter(item => arr2.includes(item)).length;
    };

    const scored = candidates.map(candidate => {
      let score = 0;

      score += overlap(loggedInUser.hobbies, candidate.hobbies) * 2;
      score += overlap(loggedInUser.favoriteMovies, candidate.favoriteMovies);
      score += overlap(loggedInUser.favoriteMusic, candidate.favoriteMusic);
      score += overlap(loggedInUser.sports, candidate.sports);
      score += overlap(loggedInUser.travelPreferences, candidate.travelPreferences);

      if (loggedInUser.drinking.toString() === candidate.drinking.toString()) score += 2;
      if (loggedInUser.smoking.toString() === candidate.smoking.toString()) score += 2;
      if (loggedInUser.diet.toString() === candidate.diet.toString()) score += 2;

      return { candidate, score };
    });

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    // Apply pagination
    const paged = scored.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      message:"Your Daily profiles has been completed",
      length: paged.length,
      data: paged.map(item => ({ ...item.candidate._doc, matchScore: item.score }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});




module.exports = userRouter;
