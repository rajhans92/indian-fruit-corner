var express = require("express");
const userController = require("../controllers/userController");
var router = express.Router();



module.exports = router => {
    const users = require("../controllers/userController");
  
    // Create a new User
    router.post("/docs", users.create);
  
    // Retrieve all Users
    router.get("/docs", users.findAll);
  
    // Retrieve a single User with customerId
    router.get("/docs/:userId", users.findOne);
  
    // Update a User with userId
    router.put("/docs/:userId", users.update);
  
    // Delete a User with userId
    router.delete("/docs/:userId", users.delete);
}
  