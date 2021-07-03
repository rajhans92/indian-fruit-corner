const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");

const userModel = require("../../models/userModel");

//validation for users request

exports.createUser = [
    body("firstName").matches(/^[a-zA-Z]{1,20}$/).trim().withMessage("First name has not empty and non-alphanumeric characters."),
	body("lastName").matches(/^[a-zA-Z]{1,20}$/).trim().withMessage("Last name must be specified.")
		.isAlphanumeric().withMessage("Last name has not empty and non-alphanumeric characters."),
	body("email").isEmail().withMessage("Email must be a valid email address.").custom((value) => {
			return new Promise(function(resolve, reject) {
				userModel.emailIsExist(value,function(error,data){
						if (!error && data) {
							reject('E-mail already in use');
						}else{
							resolve();
						}
					});
				});
		}),
	body("phoneNo").matches(/^[6-9]{1}[0-9]{9}$/).trim().withMessage("Phone No must be valid 10 digit numaric."),
	body("password").matches(/^(?=.*\d)(?=.*[@$.!%*#?&])(?=.*[a-zA-Z])[a-zA-Z\d@$.!%*#?&]{6,}$/, "i").trim().withMessage("Password must be at least 6 characters in length, one lowercase/uppercase letter, one digit and a special character(@$.!%*#?&)."),
	// Sanitize fields.
	sanitizeBody("firstName").escape(),
	sanitizeBody("lastName").escape(),
	sanitizeBody("email").escape(),
	sanitizeBody("phoneNo").escape(),
	sanitizeBody("password").escape()
];