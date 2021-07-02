const { createUser, getUsers, getUserByUserId, updateUser,deleteUser} = require("../controllers/userController");
const router = require("express").Router();

router.post("/", createUser);
router.get("/", getUsers);
router.get("/:id", getUserByUserId);
router.patch("/", updateUser);
router.delete("/", deleteUser);

module.exports = router;