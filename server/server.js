const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const db = require("./db");

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: "your secret",
  resave: false,
  saveUninitialized: true
}));

// Import and register routes
require("./routes")(app, db);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
