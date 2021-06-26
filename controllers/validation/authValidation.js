const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");

const userModel = {};
// valication for registation request

exports.sendOtp = [
	body("phoneNo").matches(/^[6-9]{1}[0-9]{9}$/).trim().withMessage("Phone No must be valid 10 digit numaric."),
	sanitizeBody("phoneNo").escape()
];

exports.verifyOtp = [
	body("phoneNo").matches(/^[6-9]{1}[0-9]{9}$/).trim().withMessage("Phone No must be valid 10 digit numaric."),
	body("otp").matches(/^[0-9]{6}$/).trim().withMessage("Invalid OTP."),
	body("hash").isLength({ min: 10 }).trim().withMessage("Invalid Input."),
	sanitizeBody("phoneNo").escape(),
	sanitizeBody("otp").escape(),
	sanitizeBody("hash").escape()
]

exports.registration = [
    body("firstName").matches(/^[a-zA-Z]{1,20}$/).trim().withMessage("First name has not empty and non-alphanumeric characters."),
	body("lastName").matches(/^[a-zA-Z]{1,20}$/).trim().withMessage("Last name must be specified.")
		.isAlphanumeric().withMessage("Last name has not empty and non-alphanumeric characters."),
	body("phoneNo").matches(/^[6-9]{1}[0-9]{9}$/).trim().withMessage("Phone No must be valid 10 digit numaric."),
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
	sanitizeBody("password").escape(),
	sanitizeBody("phoneNo").escape()
];


// validation check for login request
exports.login = [
	body("email").isEmail().withMessage("Email must be a valid email address."),
	body("password").isLength({ min: 1 }).trim().withMessage("Password must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape()
];

exports.changePassword = [
	body("currentPassword").custom((value,{req}) => {		
		return new Promise(function(resolve, reject) {
			let userId = req.user.id || 0;
			userModel.passwordIsExist(userId,value,function(error,msg){
				if (error) {
					reject(msg);
				}else{
					if(value == req.body.newPassword){
						reject("Current and New Password should not be same.");
					}else{
						resolve();
					}
				}
			});	
		})
	}),
	body("newPassword").matches(/^(?=.*\d)(?=.*[@$.!%*#?&])(?=.*[a-zA-Z])[a-zA-Z\d@$.!%*#?&]{6,}$/, "i").trim().withMessage("at least 6 characters in length, one lowercase/uppercase letter, one digit and a special character(@$.!%*#?&)."),

	body("confirmPassword").custom((value,{req}) => {
		return new Promise(function(resolve, reject) {
			if(value == req.body.newPassword){
				resolve();
			}else{
				reject('New and Confirm Password should be same.');
			}	
		})
	})
];