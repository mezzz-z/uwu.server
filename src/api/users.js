const db = require("../database/database");
const UsersController = require("../controller/Users");
const BadRequestError = require("../errors/BadRequestError");
const asyncWrapper = require("../helpers/async-wrapper");

class User extends UsersController {
	getCurrentUser = asyncWrapper(async (req, res) => {
		const userData = await db.query(
			`
        SELECT ${this.allowedFields} FROM users
        WHERE user_id = $1`,
			[req.user.userId]
		);

		res.status(200).json({ user: userData[0] });
	});
	getUsers = asyncWrapper(async (req, res) => {
		const filter = {
			username: req.query.username || "%",
			limit: 25,
		};

		const users = await db.query(`
            SELECT ${this.allowedFields} FROM users
            WHERE username ILIKE '%${filter.username}%'
            LIMIT ${filter.limit}
        `);

		res.status(200).json({ users });
	});
	getUser = asyncWrapper(async (req, res) => {
		const allowedFields = ["username", "user_id"];
		const { field, value } = req.params;

		if (!field || !value) throw new BadRequestError("Fields cannot be empty");
		if (!allowedFields.includes(field))
			throw new BadRequestError(`${field} is not allowed`);

		const userData = await db.query(
			`
        SELECT ${this.allowedFields} FROM users
        WHERE ${field} = $1`,
			[value]
		);

		if (userData.length <= 0) throw new BadRequestError("User not found");
		res.status(200).json({ user: userData[0] });
	});

	updateUserProfilePicture = async (req, res) => {
		const { profilePicture } = req.body;
		const { userId: currentUserId } = req.user;

		if (!profilePicture)
			throw new BadRequestError("ProfilePicture is required");
		if (!this.acceptMimeTypes.includes(profilePicture.mimeType))
			throw new BadRequestError("mimeType rejected");

		const updatedProfilePictureData = await db.query(
			`
            UPDATE users SET profile_picture = $1 WHERE user_id = $2 RETURNING profile_picture
        `,
			[profilePicture.data, currentUserId]
		);

		res.status(200).json({
			updatedProfilePicture: updatedProfilePictureData[0].profile_picture,
		});
	};
}

module.exports = new User();
