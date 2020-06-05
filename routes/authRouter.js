const express = require("express");
const authRouter = express.Router();
const createError = require("http-errors");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const User = require("../models/user");

// HELPER FUNCTIONS
const {
  isLoggedIn,
  isNotLoggedIn,
  validationLogin,
  validationSignup,
} = require("../helpers/middlewares");

// POST   '/auth/signup'
authRouter.post(
  "/signup",
  isNotLoggedIn,
  validationSignup,
  (req, res, next) => {
    const { fName, lName, email, genre, password } = req.body;
    console.log(
      "fName, lName, email, genre, password :>> ",
      fName,
      lName,
      email,
      genre,
      password
    );

    User.findOne({ email })
      .then((user) => {
        //  - check if the `email` exists, if it does send a response with an error
        if (user) {
          return next(createError(404));
        } else {
          //  - if `email` is unique then:
          //     - encrypt the password using bcrypt
          const salt = bcrypt.genSaltSync(saltRounds);
          const hashPass = bcrypt.hashSync(password, salt);
          //     - create the new user in DB using the `email` and the encrypted password
          User.create({ fName, lName, email, genre, password: hashPass })
            .then((newUser) => {
              //     - save the newly created user in the `session`
              newUser.password = "****";
              req.session.currentUser = newUser;
              //     - send back the response 201 (created) and the new user object
              res
                .status(201) // Created
                .json(newUser);
            })
            .catch((err) => next(createError(err)));
        }
      })
      .catch((err) => next(createError(err)));
  }
);

// POST    '/auth/login'
authRouter.post("/login", isNotLoggedIn, validationLogin, (req, res, next) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .populate("favorites reviews")

    .then((user) => {
      //  - check if user exists in the DB
      if (!user) {
        //  - if user doesn't exist - forward the error to the error middleware using `next()`
        return next(createError(401)); // Unathorized
      } else {
        //  - check if the password is correct
        const passwordCorrect = bcrypt.compareSync(password, user.password);
        if (passwordCorrect) {
          //  - if password is correct assign the user document to `req.session.currentUser`
          user.password = "****";
          req.session.currentUser = user;
          //  - send  json response
          res.status(200).json(user);
        }
      }
    })
    .catch((err) => next(createError(err)));
});

// GET   '/auth/logout'
authRouter.get("/logout", isLoggedIn, (req, res, next) => {
  //  - check if the user is logged in using helper function (check if session exists)

  //  - destroy the session
  req.session.destroy(function (err) {
    if (err) next(createError(400));
    else {
      //  - set status code and send the response back
      res
        .status(204) // No Content
        .send();
    }
  });
});

// GET    '/auth/profile'
authRouter.get("/profile", isLoggedIn, (req, res, next) => {
  const userId = req.session.currentUser._id;
  User.findById(userId)
    .populate("favorites")
    .populate({
      path: "reviews",
      model: "Review",
      populate: [
        {
          path: "user",
          model: "User",
        },
        {
          path: "plant",
          model: "Plant",
        },
      ],
    })
    .then((user) => {
      user.reviews.sort((a, b) => b.created_at - a.created_at);
      // console.log("profile user :>> ", user);
      res.status(200).json(user);
    })
    .catch((err) => console.log(err));
});

// GET    '/auth/me'
authRouter.get("/me", isLoggedIn, (req, res, next) => {
  //  - check if the user IS logged in using helper function (check if session exists)

  //  - if yes, send the response with user info (available on req.session.currentUser)
  const currentUserSessionData = req.session.currentUser;
  res.status(200).json(currentUserSessionData);
});
// GET      'auth/

module.exports = authRouter;
