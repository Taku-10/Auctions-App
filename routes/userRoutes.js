if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const router = express.Router({ mergeParams: true });
const nodemailer = require("nodemailer");
const User = require("../models/user");
const Bid = require("../models/bid");
const Listing = require("../models/listing");
const passport = require("passport");
const moment = require("moment");
const {isSignedIn, isOwnwer, resetPasswordLimiter} = require("../middleware/authenticate");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const sendEmail = require("../utilities/sendEmail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const { getBids, formatDate } = require("../utilities/BidOutcome");
const catchAsync = require("../utilities/catchAsync");

/*This route will be used to render the register form for a user to register*/
router.get("/register", (req, res) => {
  res.render("users/register.ejs");
});

/*This route will be used to register a user thus submitting the user's details to the database*/
router.post("/register", catchAsync(async (req, res, next) => {
  const { firstname, lastname, email, username, number, password } = req.body;
  const user = new User({ firstname, lastname, email, username, number });
  const registeredUser = await User.register(user, password);
  const subject = "Welcome to Auctions WA";
  const message = `Hello ${req.body.firstname}, </p>
      <p>Thank you for joining Auctions WA! We are excited to have you on board.</p>
      <p>You can start browsing listings by visising <a href="http://localhost:3000/listings">Go to listings page</a>.</p>
      <p>Best regards, <br/> The Auctions WA Team</p>,`;
  await sendEmail(req.body.email, subject, message);
  req.logIn(registeredUser, (err) => {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      req.flash("success", "Welcome");
      res.redirect("/listings");
    }
  });
}));


/*This route will be used to render the log in form for the user to log in*/
router.get("/login", (req, res) => {
  res.render("users/login");
});

/*This route will be used to log in the user by checking the provided details on the log in form correspond to the
 ones in the database*/
router.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", "Welcome back to Bid Mart");
    const redirectUrl = req.session.returnTo || "/listings";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

/*This route will be used to log out the user*/
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Goodbye!");
    res.redirect("/listings");
  });
});

/*User profile management routes*/

// This will render the form with the user's personal details

router.get("/profile", isSignedIn, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.render("users/profile", { user });
}));


// This route will post the users updates to the form
router.put("/profile/:id", isSignedIn, catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  const updatedUser = await User.findByIdAndUpdate(userId, req.body, {
    new: true,
    runValidators: true,
  });
  req.login(updatedUser, (err) => {
    if (err) {
      console.log(err);
      return next(err);
    }
    req.flash("success", "Successfully updated your profile");
    res.redirect("/profile");
  });
}));


router.get("/bids", isSignedIn, catchAsync(async (req, res) => {
  const bids = await getBids(req.user._id);
  console.log(`This user has ${bids.length} bids`);
  res.render("users/bids", { bids });
}));


router.get("/mylistings", isSignedIn, catchAsync(async (req, res) => {
  const currentUserId = req.user._id;
  // Find all the listings that have been posted by the currently logged in user
  const listings = await Listing.find({ owner: currentUserId });
  res.render("users/mylistings", { listings, formatDate});
}));


// Route to render the password change form
router.get("/password", isSignedIn, (req, res) => {
  // Get the form data from the session
  const formData = req.flash("form")[0];
  res.render("users/changePassword", { formData });
});

// Route to handle the password change request
router.post("/change-password", isSignedIn, async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  const user = req.user;

  // Check if the new password and confirmation match
  if (newPassword !== confirmNewPassword) {
    // Handle password mismatch error
    req.flash("error", "Passwords do not match");

    // Store the form data in the session to prepopulate the form
    req.flash("form", { oldPassword, newPassword, confirmNewPassword });

    return res.redirect("/password");
  }

  try {
    // Use the `changePassword` method provided by Passport.js to change the user's password
    await user.changePassword(oldPassword, newPassword);

    // Redirect to success page
    req.flash("success", "Password changed successfully");
    return res.redirect("/profile");
  } catch (err) {
    // Handle password change error
    req.flash("error", "Incorrect username and or password");

    // Store the form data in the session to prepopulate the form
    req.flash("form", { oldPassword, newPassword, confirmNewPassword });

    return res.redirect("/password");
  }
});

// Forgot password page
router.get("/forgot", (req, res) => {
  res.render("users/forgot");
});

// Process forgot password form
router.post("/forgot", catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash("error", "Incorrect or invalid email address");
    return res.redirect("/login");
  }

  // Generate reset token
  user.generateResetToken();
  await user.save();

  // Send reset email
  const resetUrl = `http://${req.headers.host}/reset/${user.resetPasswordToken}`;
  const subject = "Password Reset";
  const message = `
  <p>Hello ${user.firstname} ${user.lastname}</p>
  <p>You requested to reset your password. Please click the link below to set a new password.</p>
  <p>If you did not request a password reset, you can ignore this email</p>
  <a href="${resetUrl}">Reset password</a>
  <p>Best regards, <br/> The Auctions WA Team</p>, `;

  await sendEmail(user.email, subject, message);
  req.flash("success", "An email has been sent to your email address with further instructions.");
  res.redirect("/login");
}));


// Reset password page
router.get("/reset/:token", resetPasswordLimiter, catchAsync(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "Password reset token is invalid or has expired.");
    return res.redirect("/login");
  }

  res.render("users/reset", { token: req.params.token });
}));

// Process reset password form
router.post("/reset/:token", resetPasswordLimiter, catchAsync(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    req.flash("error", "Password reset token is invalid or has expired.");
    return res.redirect("/forgot");
  }

  // Update password
  await user.setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const subject = "Password Reset Confirmation";
  const message = `<p>Hello ${user.firstname} ${user.lastname}</p>
  <p>Your password has been successfully reset</p>
  <p>If you did this, you can safely disregard this email</p>
  <p>If you didn't dot his, please go to the log in page and click "Forgot password" to reset your password</p>
  <p>Best regards, <br/> The Auctions WA Team</p>, 
  `;
  // Send confirmation email
  await sendEmail(user.email, subject, message);
  req.flash("success", "Your password has been successfully reset.");
  res.redirect("/login");
}));

module.exports = router;
