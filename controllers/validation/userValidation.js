const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");

const userMangModel = require("../../models/userManagModel");

//validation for users request

module.exports = [
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
	body("password").matches(/^(?=.*\d)(?=.*[@$.!%*#?&])(?=.*[a-zA-Z])[a-zA-Z\d@$.!%*#?&]{6,}$/, "i").trim().withMessage("Password must be at least 6 characters in length, one lowercase/uppercase letter, one digit and a special character(@$.!%*#?&)."),
	// Sanitize fields.
	sanitizeBody("firstName").escape(),
	sanitizeBody("lastName").escape(),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape()
];