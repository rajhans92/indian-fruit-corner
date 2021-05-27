const crypto = require('crypto');
const moment = require('moment');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const authValidation = require("./validation/authValidation");
const userModel = require("../models/userModel");
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const auth = require("../middlewares/jwt");

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
	(request, response) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(request);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(response, "Validation Error.", errors.array());
			}else {
				//hash input password
				bcrypt.hash(request.body.password,10,function(err, hash) {

					var verifyToken = crypto.randomBytes(40).toString('hex');

					let userData = [
						request.body.firstName,
						request.body.lastName,
						request.body.email,
						request.body.phoneNo,
						hash,
						process.env.ROLE_ID,
						1,
						verifyToken,
						moment().format("YYYY-MM-DD HH:mm:ss")
					];
					console.log("data = ",userData);
					
					userModel.registration(userData,function(error){
						if(!error){
							// Html email body
							let html = `<p>Hi ${request.body.firstName} ${request.body.lastName},<br></p><p>Please click this link and Confirm your Account.</p> <a href="${process.env.WEBSITE_URL}/activation/${verifyToken}">Active</a>`;
							// Send confirmation email
							mailer.send(
								constants.confirmEmails.from, 
								request.body.email,
								"Confirm Account",
								html
							).then(function(){
								return apiResponse.successResponse(response,"Registration Successfully.");
							}).catch(err => {
								console.log(err);
								return apiResponse.ErrorResponse(response,err);
							}) ;
						}else{
							return apiResponse.unauthorizedResponse(response, "Something went wrong!");
						}
					})
				});
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
					if(!error){
						userModel.login(request.body.email,request.body.password,function(error,user){
							if(!error){
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