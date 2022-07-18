const router = require("express").Router();
const friendsAPI = require("../api/friends.js");
const usersAPI = require("../api/users.js");

router.get("/", usersAPI.getCurrentUser);
router.patch("/updateProfilePicture", usersAPI.updateUserProfilePicture);
router.get("/friendRequests", friendsAPI.getUserFriendRequests);
router.get("/friends", friendsAPI.getUserFriends);

module.exports = router;
