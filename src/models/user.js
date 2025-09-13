const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    lastName: {
        type: String,
        uppercase: true,
        trim: true
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8
    },
    age: {
        type: Number
    },
    gender: {
        type: String,
        validate(value) {
            if (!["male", "female", "others"].includes(value.toLowerCase())) {
                throw new Error("Gender data is not valid");
            }
        }
    },
    photoUrl: {
        type: String,
        default: "https://example.com/default-avatar.png"
    },
    about: {
        type: String,
        default: "about the user"
    },
    Skills: [{
        type: String
    }]
}, { timestamps: true });


// ✅ Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// ✅ Password verification method
userSchema.methods.verifyPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// ✅ JWT generation method
userSchema.methods.generateJWT = function () {
    return jwt.sign(
        { _id: this._id, email: this.emailId },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

const User = mongoose.model("User", userSchema);

module.exports = User;
