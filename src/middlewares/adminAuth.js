const jwt = require('jsonwebtoken');
const User = require('../models/user');

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies
    if (!token) {
        return res.status(401).send("Please Login!")
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const {_id} = decoded;
    const user = await User.findById(_id)

    if (!user) {
      return res.status(404).send({ error: 'User not found', message: 'The user associated with this token does not exist.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.'+ res.message });
  }
};

module.exports = { userAuth };
