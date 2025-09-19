const validator = require('validator');

const validateProfileData = (req) => {
    const allowedFields = [
        "firstName",
        "lastName",
        "photoUrl",
        "age",
        "gender",
        "about",
        "Location",
        "Height",
        "Education",
        "Occupation",
        "Lamguages",
        "Beliefs",
        "LookingFor",
        "PreferredAge",
        "DistancePreference",
        "Hobbies",
        "Favoritemovies",
        "FavoriteMusic",
        "Sports",
        "TravelPreferences",
        "pets",
        "Drinking",
        "Smoking",
        "Diet",
        "prompt1",
        "prompt2",
        "prompt3",
        "prompt4",
        "prompt5"
    ];

    const invalidFields = Object.keys(req.body).filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
        return { valid: false, message: `Invalid fields: ${invalidFields.join(", ")}` };
    }
    return { valid: true };
};


module.exports = { validateProfileData };
