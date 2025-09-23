const validator = require("validator");

const validateProfileData = (req) => {
  const allowedFields = [
    "firstName",
    "lastName",
    "photoUrl",
    "age",
    "gender",
    "about",
    "location",
    "height",
    "education",
    "occupation",
    "beliefs",
    "languages",
    "lookingFor",
     "preferredAgemin",
    "preferredAgemax",
    "distancePreference",
    "hobbies",
    "favoriteMovies",
    "favoriteMusic",
    "sports",
    "travelPreferences",
    "pets",
    "drinking",
    "smoking",
    "diet",
  ];

  // ❌ reject unknown fields
  const invalidFields = Object.keys(req.body).filter(
    (field) => !allowedFields.includes(field)
  );
  if (invalidFields.length > 0) {
    return {
      valid: false,
      message: `Invalid fields: ${invalidFields.join(", ")}`,
    };
  }

  // ✅ some simple schema-level checks
  if (req.body.age && (!validator.isInt(String(req.body.age), { min: 18, max: 120 }))) {
    return { valid: false, message: "Age must be a number between 18 and 120." };
  }

  if (req.body.gender && !["male", "female", "other", "Male", "Female", "Other"].includes(req.body.gender)) {
  return { valid: false, message: "Gender must be Male, Female, or Other." };
}


if (req.body.preferredAgemin !== undefined && req.body.preferredAgemax !== undefined) {
  const min = req.body.preferredAgemin;
  const max = req.body.preferredAgemax;

  if (min > max) {
    return { valid: false, message: "Preferred age min cannot be greater than max." };
  }

  if (min < 18 || max > 100) {
    return { valid: false, message: "Preferred age must be between 18 and 100." };
  }
}


  return { valid: true };
};

module.exports = { validateProfileData };
