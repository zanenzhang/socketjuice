require('dotenv').config();
const passport = require("passport");
const User = require('../model/User');

// serialize the user.id to save in the cookie session
// so the browser will remember the user when login
passport.serializeUser((foundUser, done) => {
  done(null, foundUser.id);
});

// deserialize the cookieUserId to user in the database
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(foundUser => {
      done(null, foundUser);
    })
    .catch(e => {
      done(new Error("Failed to deserialize an user"));
    });
});