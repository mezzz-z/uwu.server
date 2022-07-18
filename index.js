const cors = require("cors");
const db = require("./src/database/database");
const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const socket = require("./src/socket/Socket");
require("dotenv").config();

const PORT = process.env.PORT;
const incomingJsonSizeLimit = 10 * 1024 * 1024;

app.use(
	cors({
		credentials: true,
		origin: ["http://localhost:3000"],
	})
);
app.use(cookieParser({ secret: "secret" }));
app.use(express.json({ limit: incomingJsonSizeLimit }));
app.use(express.urlencoded({ extended: true }));

// listen to socket.io server
// config socket io listeners
socket.listen(httpServer);
socket.configListeners();

// router
app.use("/api/v1", require("./src/routes/index.js"));

// error handler
app.use(require("./src/middleware/errorHandler"));

// not found
app.all("*", (req, res) => {
	res.status(404).json({ status: 404 });
});

// config db
db.config(JSON.parse(process.env.DB_CONFIG));

// start
const start = () => {
	const startServer = httpServer.listen(PORT, () => {
		console.log(`server is listening on port ${PORT}`);
	});
	db.start(startServer);
};

start();
