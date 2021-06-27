module.exports = app => {
    const customers = require("../controllers/userController");
  
    // Create a new Customer
    app.post("/docs", users.create);
  
    // Retrieve all Customers
    app.get("/docs", users.findAll);
  
    // Retrieve a single Customer with customerId
    app.get("/docs/:userId", users.findOne);
  
    // Update a Customer with customerId
    app.put("/docs/:userId", users.update);
  
    // Delete a Customer with customerId
    app.delete("/docs/:userId", users.delete);
}
  