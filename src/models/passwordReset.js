const mongoose = require('mongoose')

const passwordResetSchema = new mongoose.Schema({
    emailId : {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
        index: { expires: 0 } // TTL index - auto delete after expiry
    },
    verified: {
        type: Boolean,
        default: false
  }
});

const PasswordReset =  mongoose.model("PasswordReset", passwordResetSchema);

module.exports = PasswordReset;