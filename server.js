var 	express = require("express"),
	app = express.createServer();

// Serve Static Files with express
app.use(express.static(__dirname + '/www'));
app.listen(80);