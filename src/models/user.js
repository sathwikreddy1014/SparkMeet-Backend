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
  lowercase: true, // Mongoose will convert automatically
  enum: ["male", "female", "others"], // built-in validation
},

    photoUrl: {
        type: String,
        default: "https://media.istockphoto.com/id/1131164548/vector/avatar-5.jpg?s=612x612&w=0&k=20&c=CK49ShLJwDxE4kiroCR42kimTuuhvuo2FH5y_6aSgEo="
    },
    about: {    
        type: String,
        default: "about the user"
    },
  // 📍 Location
  location: {
    type: String, // store city name
    trim: true,
  },

  // 📏 Height
  height: {
    value: { type: Number }, // numeric height
    unit: { type: String, enum: ["cm", "ft"] }, // cm or ft
  },

  // 🎓 Education
  education: {
    type: String,
    enum: ["High School", "Bachelor’s", "Master’s", "PhD", "Other"],
  },

  // 💼 Occupation
  occupation: {
    type: String,
    enum: ["Job", "Business", "Student", "Other"],
  },

  // 🙏 Beliefs
  beliefs: {
    type: String,
    enum: ["Spiritual", "Religious", "Agnostic", "Atheist"],
  },

  // 🗣️ Languages (max 5)
  languages: {
    type: [String],
    validate: [(val) => val.length <= 5, "Max 5 languages allowed"],
  },

  // ❤️ Looking For
  lookingFor: {
    type: String,
    enum: ["Long Term", "Short Term", "Go with the Flow"],
  },

  // 🎂 Preferred Age
  preferredAge: {
    min: { type: Number },
    max: { type: Number },
  },

  // 📍 Distance Preference
  distancePreference: {
    type: Number, // in km
    max: 120,
  },

  // 🎨 Hobbies
  hobbies: [String], // array of hobbies

  // 🎬 Favorite Movies
  favoriteMovies: [String], // array of movie names

  // 🎶 Favorite Music
  favoriteMusic: [String], // array of song names

  // 🏀 Sports
  sports: [String], // array of sports

  // ✈️ Travel Preferences
  travelPreferences: [String], // array of travel choices

  // 🐶 Pets
  pets: {
    type: String,
    enum: ["Dog Person", "Cat Person", "Both", "No Pets"],
  },

  // 🍷 Drinking
  drinking: {
    type: String,
    enum: ["Not for Me", "Occasionally", "Yes"],
  },

  // 🚬 Smoking
  smoking: {
    type: String,
    enum: ["No", "Occasionally", "Yes"],
  },

  // 🥗 Diet
  diet: {
    type: String,
    enum: ["Veg", "Non-Veg", "Vegan"],
  },
    prompt1: [{
      type: String
    }],
    prompt2: [{
      type: String
    }],
    prompt3: [{
      type: String
    }],
    prompt4: [{
      type: String
    }],
    prompt5: [{
      type: String
    }]
}, { timestamps: true });


// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// ✅ Password verification method
userSchema.methods.verifyPassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

// ✅ JWT generation method
userSchema.methods.generateJWT = function () {
  return jwt.sign(
    { _id: this._id },   // ✅ force _id
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const User = mongoose.model("User", userSchema);

module.exports = User;
