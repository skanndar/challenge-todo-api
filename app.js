const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const port = process.env.PORT || 4000;
const publicDomain = process.env.PUBLIC_DOMAIN || "http://localhost:3000";
const authRouter = require("./routes/authRouter");
const session = require("express-session");

const config = require("./config/db");

const app = express();

const MongoStore = require("connect-mongo")(session);
require("dotenv").config();

mongoose.Promise = global.Promise;
mongoose.connect(config.DB).then(
  () => {
    console.log("Database is connected");
  },
  (err) => {
    console.log("Can not connect to the database" + err);
  }
);

const todoRoute = require("./routes/todoRoute");

app.use(bodyParser.json());
app.use(
  cors({
    credentials: true,
    origin: [publicDomain],
  })
);

// SESSION MIDDLEWARE
app.use(
  session({
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 24 * 60 * 60 * 30 * 6, // 6 months
    }),
    secret: "blablabla",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use("/api/v1", todoRoute);
app.use("/auth", authRouter);

// ERROR HANDLING
// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).json({ code: "not found" });
});

app.use((err, req, res, next) => {
  // always log the error
  console.error("ERROR", req.method, req.path, err);

  // only render if the error ocurred before sending the response
  if (!res.headersSent) {
    const statusError = err.status || "500";
    res.status(statusError).json(err);
  }
});

const server = app.listen(port, function () {
  console.log("Listening on port " + port);
});
