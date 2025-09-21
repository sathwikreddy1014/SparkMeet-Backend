const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    emailId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, trim: true, minlength: 8 },
    photoUrl: { type: String, trim: true, default: ""},
    age: { type: Number, min: 18, max: 100 },
    gender: { type: String, trim: true, lowercase: true }, // removed enum
    about: { type: String, maxlength: 500, default: "" },
    location: { type: String, trim: true, default: "" },
    height: {
       type: String, trim: true, default: ""
    },
    education: { type: String, trim: true, default: "" },
    occupation: { type: String, trim: true, default: "" },
    beliefs: { type: String, trim: true, default: "" },
    languages: { type: [String], default: [] },
    lookingFor: { type: String, trim: true, default: "" },
    preferredAge: {
      min: { type: Number, min: 18, max: 100, default: 18 },
      max: { type: Number, min: 18, max: 100, default: 30 },
    },
    distancePreference: { type: Number, min: 0, max: 1000, default: 0 },
    hobbies: { type: [String], default: [] },
    favoriteMovies: { type: [String], default: [] },
    favoriteMusic: { type: [String], default: [] },
    sports: { type: [String], default: [] },
    travelPreferences: { type: [String], default: [] },
    pets: { type: [String], trim: true, default: "" },
    drinking: { type: [String], trim: true, default: "" },
    smoking: { type: [String], trim: true, default: "" },
    diet: { type: [String], trim: true, default: "" },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Verify password
userSchema.methods.verifyPassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

// Generate JWT
userSchema.methods.generateJWT = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const User = mongoose.model("User", userSchema);
module.exports = User;
