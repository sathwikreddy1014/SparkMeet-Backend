const validator = require('validator');
const bcrypt = require('bcrypt'); // You forgot to require bcrypt

const validatePassword = async (req) => {

    const { password, newPassword }  = req.body;

    const currentuser = req.user;

   const isMatch = await bcrypt.compare(password, currentuser.password);

    if(!isMatch) {
         throw new Error("Incorrect current password.");
    };

    if(!validator.isStrongPassword(newPassword)) {
         throw new Error("New password is not strong enough.");
    }
};

module.exports = { validatePassword };
