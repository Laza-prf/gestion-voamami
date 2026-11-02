const express = require("express" );
const app = express();

const authRoutes = require("./routes/auth.routes.js");
const userRoutes = require("./routes/users.routes.js");



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

module.exports = app;
