const jwt = require('jsonwebtoken');
const User = require('../models/user');

const userAuth = async (req, res, next) => {

  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ error: "Please login! No token found." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { _id } = decoded;

    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ error: "User not found for this token." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({ error: "Please authenticate: " + error.message });
  }
};

module.exports = { userAuth };
