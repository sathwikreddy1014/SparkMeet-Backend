const validator = require("validator");

const validateSignupData = (req) => {
    const { firstName, lastName, emailId, password, age } = req.body;

    if (!firstName || !lastName) {
        throw new Error("Name is not valid!!")
    }
    else if(!validator.isEmail(emailId)){
        throw new Error("email is not valid");
    }
    else if (!validator.isStrongPassword(password)){
        throw new Error("Create a Strong Password");  
    }else if (age < 18 ) {
        throw new Error("Minimum Age required is 18");
    }else if (age > 55) {
        throw new Error("Maximum Age is 55");
    }
};

module.exports = { validateSignupData }