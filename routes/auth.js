var express = require("express");
const authController = require("../controllers/authController");

var router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/change-password", authController.changePassword);
router.get("/verify-email/:token", authController.verifyEmail);

// router.post("/verify-otp", AuthController.verifyConfirm);
// router.post("/resend-verify-otp", AuthController.resendConfirmOtp);

module.exports = router;