const checkAuth = require("../middleware/checkAuth");
const router = require("express").Router();
const usersAPI = require("../api/users");
const currentUserRouter = require("./currentUser.js");

router.get("/", usersAPI.getUsers);
router.use("/current", checkAuth, currentUserRouter);
router.get("/:field/:value", usersAPI.getUser);

module.exports = router;
