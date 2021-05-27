var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res) {
	res.json({status:false,message:`Welcome to ${process.env.APP_NAME} api.`});
});

module.exports = router;
