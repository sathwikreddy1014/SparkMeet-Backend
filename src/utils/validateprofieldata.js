const validator = require('validator');

const validateProfileData = (req) => {
    const allowedFields = [
        "firstName",
        "lastName",
        "photoUrl",
        "age",
        "skills",
        "gender",
        "about"
    ];

    const invalidFields = Object.keys(req.body).filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
        return { valid: false, message: `Invalid fields: ${invalidFields.join(", ")}` };
    }
    return { valid: true };
};


module.exports = { validateProfileData };
