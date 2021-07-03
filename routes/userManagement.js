const userController = require("../controllers/userController");
const router = require("express").Router();

router.post("/create", userController.createUser);     //  api/user/create
// router.get("/get-user-list", userController.getUsers); //  api/user/get-user-list
// router.get("/detail/:id", userController.getUserByUserId);    //  api/user/detail/id
// router.patch("/update", userController.updateUser);    //  api/user/update
// router.delete("/delete", userController.deleteUser);   //  api/user/delete

module.exports = router;