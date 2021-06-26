const crypto = require('crypto');
const moment = require('moment');
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const client = require('twilio')(process.env.TWILLIO_ACCOUNT_SID,process.env.TWILLIO_AUTH_TOKEN);
const authValidation = require("./validation/authValidation");
const userModel = {};
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const auth = require("../middlewares/jwt");


/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     tags:
 *       - AuthController
 *     description: Send OTP using phone number api
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         description: Request Object
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - phoneNo
 *           properties:
 *             phoneNo:
 *               type: integer
 *     	responses:
 *        '200':
 *          description: OTP sent Successfully
 *        '401':
 *          description: Invalid Phone Number
 */

 exports.sendOtp = [
	// Validate fields.
	authValidation.sendOtp,
	// Process request after validation and sanitization.
	async (request, response) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(request);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(response, "Validation Error.", errors.array());
			}else {
				const phoneNo = request.body.phoneNo;
				const otp = Math.floor(100000 + Math.random()*900000);
				const ttl = parseInt(process.env.OTP_TIMEOUT_DURATION) *60*1000;
				const expire = Date.now() + ttl;
				const data = `${phoneNo}.${otp}.${expire}`
				const hash = crypto.createHmac('sha256',process.env.SMS_SECRET_KET).update(data).digest('hex');
				const fullHash = `${hash}.${expire}`;

				// client.messages.create({
				// 	body: `You one time password for IFC is ${otp}`,
				// 	from: process.env.TWILLIO_NUMBER,
				// 	to: `${process.env.COUNTRY_CODE}${phoneNo}`
				// }).then((message)=>{
				// 	return apiResponse.successResponseWithData(response,"OTP sent Successfully.",{phoneNo,hash:fullHash});
				// }).catch((error)=>{
				// 	console.log(error);
				// 	return apiResponse.ErrorResponse(response, "Something went wrong!");
				// });

				return apiResponse.successResponseWithData(response,"OTP sent Successfully.",{phoneNo,hash:fullHash,otp:otp});

			}
		} catch (error) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(response, error);
		}
	}];

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     tags:
 *       - AuthController
 *     description: Verify OTP api
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         description: Request Object
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - phoneNo
 *             - hash
 *             - otp
 *           properties:
 *             phoneNo:
 *               type: integer
 *             hash:
 *               type: string
 *             otp:
 *               type: integer
 *     	responses:
 *       200:
 *         description: OTP verified Successfully
 *       401:
 *         description: Invalid OTP, please try again.
 */

 exports.verifyOtp = [
	// Validate fields.
	authValidation.verifyOtp,
	// Process request after validation and sanitization.
	async (request, response) => {
		try {
			console.log("request ",request.body);
			// Extract the validation errors from a request.
			const errors = validationResult(request);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(response, "Validation Error.", errors.array());
			}else {
				const phoneNo = request.body.phoneNo;
				const hash = request.body.hash;
				const otp = request.body.otp;
				let [hashValue, expires] = hash.slipt('.');
				let now = Date.now();
				console.log("entry ");

				if(now > parseInt(expires)){
					return apiResponse.ErrorResponse(response, "OTP expired, please try again.");
				}
				const data = `${phoneNo}.${otp}.${expires}`
				const genHhash = crypto.createHmac('sha256',process.env.SMS_SECRET_KET).update(data).digest('hex');
				if( genHhash !== hashValue){
					return apiResponse.ErrorResponse(response, "Invalid OTP.");
				}
				return apiResponse.successResponse(response,"OTP verified Successfully.");

			}
		} catch (error) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(response, error);
		}
	}];


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - AuthController
 *     description: User registration Api
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         description: Registration object
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - firstName
 *             - lastName
 *             - phoneNo
 *             - email
 *             - password
 *           properties:
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             phoneNo:
 *               type: integer
 *             email:
 *               type: string
 *             password:
 *               type: string
 *     	responses:
 *       200:
 *         description: Registration Successfully
 * 
 */

exports.register = [
	// Validate fields.
	authValidation.registration,
	// Process request after validation and sanitization.
	async (request, response) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(request);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(response, "Validation Error.", errors.array());
			}else {

				var verifyToken = crypto.randomBytes(40).toString('hex'); // create token for account verificaton

				let userData = {
					firstName:request.body.firstName,
					lastName:request.body.lastName,
					email:request.body.email,
					phoneNo:request.body.phoneNo,
					password:request.body.password,
					verifyToken:verifyToken,
					status:0
				};

				userModel.registration(userData,async function(error,data){
					if(!error){
						// Html email body
						let html = `<p>Hi ${request.body.firstName} ${request.body.lastName},<br></p><p>Please click this link and Confirm your Account.</p> <a href="${process.env.WEBSITE_URL}/activation/${verifyToken}">Active</a>`;
						// Send confirmation email
						try{
							await mailer.send(
								constants.confirmEmails.from, 
								request.body.email,
								"Confirm Account",
								html
							);
							return apiResponse.successResponse(response,"Registration Successfully.");
						}catch(error){
							return apiResponse.ErrorResponse(response,"Registration Successfully, But verifying mail couldn't be sent. Please contact to administrator.");
						}
	
					}else{
						return apiResponse.unauthorizedResponse(response, "Something went wrong!");
					}
				})
			}
		} catch (error) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(response, error);
		}
	}];

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - AuthController
 *     description: Login Api
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         description: Login object
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - email
 *             - password
 *           properties:
 *             email:
 *               type: string
 *             password:
 *               type: string
 *     	responses:
 *       200:
 *         description: Login Successfully
 * 
 */

exports.login = [
	authValidation.login,
	(request, response) => {
		try {
			const errors = validationResult(request);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(response, "Validation Error.", errors.array());
			}else {
				userModel.emailIsExist(request.body.email,function(error,data){
					if(!error && data){
						userModel.login(request.body.email,request.body.password,function(error,user){
							if(!error && user){
								let userData = user;
								//Prepare JWT token for authentication
								const jwtPayload = userData;
								const jwtData = {
									expiresIn: process.env.JWT_TIMEOUT_DURATION,
								};
								const secret = process.env.JWT_SECRET;
								//Generated JWT token with Payload and secret.
								userData.token = jwt.sign(jwtPayload, secret, jwtData);
								return apiResponse.successResponseWithData(response,"Login Success.", userData);
							}else{
								return apiResponse.unauthorizedResponse(response, user.msg);
							}
						});
					}else{
						return apiResponse.unauthorizedResponse(response, data.msg);
					}
				});

			}
		} catch (error) {
			return apiResponse.ErrorResponse(response, error);
		}
	}];

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - AuthController
 *     description: Logout Api
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         in: header
 *         type: string
 *         required: true
 *     	responses:
 *       200:
 *         description: Logout Successfully
 * 
 */	
exports.logout = [
	auth,
	(request, response) => {
		return apiResponse.successResponse(response,"Logout Successfully");
	}];

/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     tags:
 *       - AuthController
 *     description: Email verification Api
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: token
 *         description: verification Token
 *         in: path
 *         required: true
 *         type: string
 *     	responses:
 *       200:
 *         description: Email Id verified successfully!
 * 
 */	
exports.verifyEmail = [
	(request, response) => {
		try {
			var token = request.params.token;

			userModel.verifyToken(token,function(error,msg){
				if (error) {
					return apiResponse.successResponse(response, msg);
				}else{
					return apiResponse.unauthorizedResponse(response, msg);
				}
			});

		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];
		
/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags:
 *       - AuthController
 *     description: Change password Api
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: body
 *         description: Request object
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - currentPassword
 *             - newPassword
 *             - confirmPassword
 *           properties:
 *             currentPassword:
 *               type: string
 *             newPassword:
 *               type: string
 *             confirmPassword:
 *               type: string
 *       - name: token
 *         in: header
 *         type: string
 *         required: true
 *     	responses:
 *       200:
 *         description: Password Updated Successfully.
 * 
 */

exports.changePassword = [
	auth,
	authValidation.changePassword,
	(request, response) => {
		try {
			const errors = validationResult(request);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(response, "Validation Error.", errors.array());
			}else {
				bcrypt.hash(request.body.newPassword,10,function(err, hash) {
					if(err){
						return apiResponse.ErrorResponse(response, "Something went wrong!");
					}else{
						let userId = request.user.id;
						let password = hash;

						userModel.updatePassword(userId,password,function(error,msg){
							if(error){
								return apiResponse.ErrorResponse(response, msg);
							}else{
								return apiResponse.successResponse(response, msg);
							}
						})
					}
				});
			}

		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];
	
/**
 * Verify Confirm otp.
 *
 * @param {string}      email
 * @param {string}      otp
 *
 * @returns {Object}
 */
// exports.verifyConfirm = [
// 	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
// 		.isEmail().withMessage("Email must be a valid email address."),
// 	body("otp").isLength({ min: 1 }).trim().withMessage("OTP must be specified."),
// 	sanitizeBody("email").escape(),
// 	sanitizeBody("otp").escape(),
// 	(req, res) => {
// 		try {
// 			const errors = validationResult(req);
// 			if (!errors.isEmpty()) {
// 				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
// 			}else {
// 				var query = {email : req.body.email};
// 				UserModel.findOne(query).then(user => {
// 					if (user) {
// 						//Check already confirm or not.
// 						if(!user.isConfirmed){
// 							//Check account confirmation.
// 							if(user.confirmOTP == req.body.otp){
// 								//Update user as confirmed
// 								UserModel.findOneAndUpdate(query, {
// 									isConfirmed: 1,
// 									confirmOTP: null 
// 								}).catch(err => {
// 									return apiResponse.ErrorResponse(res, err);
// 								});
// 								return apiResponse.successResponse(res,"Account confirmed success.");
// 							}else{
// 								return apiResponse.unauthorizedResponse(res, "Otp does not match");
// 							}
// 						}else{
// 							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
// 						}
// 					}else{
// 						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
// 					}
// 				});
// 			}
// 		} catch (err) {
// 			return apiResponse.ErrorResponse(res, err);
// 		}
// 	}];

/**
 * Resend Confirm otp.
 *
 * @param {string}      email
 *
 * @returns {Object}
 */
// exports.resendConfirmOtp = [
// 	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
// 		.isEmail().withMessage("Email must be a valid email address."),
// 	sanitizeBody("email").escape(),
// 	(req, res) => {
// 		try {
// 			const errors = validationResult(req);
// 			if (!errors.isEmpty()) {
// 				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
// 			}else {
// 				var query = {email : req.body.email};
// 				UserModel.findOne(query).then(user => {
// 					if (user) {
// 						//Check already confirm or not.
// 						if(!user.isConfirmed){
// 							// Generate otp
// 							let otp = utility.randomNumber(4);
// 							// Html email body
// 							let html = "<p>Please Confirm your Account.</p><p>OTP: "+otp+"</p>";
// 							// Send confirmation email
// 							mailer.send(
// 								constants.confirmEmails.from, 
// 								req.body.email,
// 								"Confirm Account",
// 								html
// 							).then(function(){
// 								user.isConfirmed = 0;
// 								user.confirmOTP = otp;
// 								// Save user.
// 								user.save(function (err) {
// 									if (err) { return apiResponse.ErrorResponse(res, err); }
// 									return apiResponse.successResponse(res,"Confirm otp sent.");
// 								});
// 							});
// 						}else{
// 							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
// 						}
// 					}else{
// 						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
// 					}
// 				});
// 			}
// 		} catch (err) {
// 			return apiResponse.ErrorResponse(res, err);
// 		}
// 	}];