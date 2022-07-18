const jwt = require("jsonwebtoken");
const db = require("../database/database");

module.exports = class UsersController {
	allowedFields = "user_id, username, email, profile_picture, status";
	acceptMimeTypes = ["image/jpeg", "image/png"];

	async getUserByFilter(filter) {
		const stringifiedFilter = db.stringifyFilter(filter);
		const data = await db.query(`
            SELECT * FROM users
            WHERE ${stringifiedFilter}
        `);

		return data[0];
	}

	formatProfilePicture(encodedData) {
		if (!encodedData) return null;
		return `data:image/jpeg;base64,${encodedData}`;
	}
};
