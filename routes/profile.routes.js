const express = require('express');
const { isValidObjectId } = require('mongoose');
const router = express.Router();

// Cloudinary for profile picture upload
const {fileUploader, cloudinary} = require('../config/cloudinary.config');

const isLoggedIn = require('../middleware/isLoggedIn');
const User = require('../models/User.model');

// ℹ️ Handles password encryption
const bcrypt = require("bcrypt");
const saltRounds = 10;

router.get("/", isLoggedIn, async (req, res, next) => {
  try {
    const user = req.session.currentUser;
    res.render("profile/myProfile", {user});
    
  } catch (error) {
    next(error);
  }
});

router.post('/', isLoggedIn, fileUploader.single('image-url'), async (req, res, next) => {
  try {
    // get form data, update profile, return to profile
    const {username, email, firstName, lastName, password, passwordConfirmation} = req.body;

    if (password !== passwordConfirmation) {
      // TODO: Error message
      return res.redirect('/profile')
    }

    const updatedUser = {};

    if (username.length) updatedUser.username = username;
    if (email.length) updatedUser.email = email;
    if (firstName.length) updatedUser.firstName = firstName;
    if (lastName.length) updatedUser.lastName = lastName;

    if (req.file) {
      const transformed = cloudinary.url(req.file.filename, {width: 200, crop: "limit"});
      updatedUser.profilePictureURL = transformed;
      
    } else {
      console.log('no file uploaded')
    }

    if (password.length) {
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      updatedUser.password = hashedPassword;
    }
    
    const user = await User.findByIdAndUpdate(req.session.currentUser._id, updatedUser, {new: true});
    req.session.currentUser = user;

    res.redirect('/profile');
  } catch (error) {
    next(error);
  }
});

router.get("/:userId", isLoggedIn, async (req, res, next) => {
  try {
    const id = req.params.userId;
    if (!isValidObjectId(id)) throw Error(`${id} is not a valid user id!`);

    const user = await User.findById(id)
    res.render("profile/userProfile", {user});

  } catch (error) {
    next(error);
  }
})

module.exports = router