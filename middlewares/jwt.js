const jwt = require("jsonwebtoken");
const apiResponse = require("../helpers/apiResponse");

const authenticateJWT = (request, response, next) => {
    const authHeader = request.headers.token || null;

    if (authHeader) {

        jwt.verify(authHeader, process.env.JWT_SECRET, (err, user) => {
            if (err) {
				return apiResponse.unauthorizedResponse(response, "Unauthorized access");
            }

            request.user = user;
            next();
        });
    } else {
		return apiResponse.unauthorizedResponse(response, "Unauthorized access");
    }
};

module.exports = authenticateJWT;
