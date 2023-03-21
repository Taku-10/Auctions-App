const express = require("express");
const router = express.Router({ mergeParams: true });
const nodemailer = require("nodemailer");
const User = require("../models/user");
const Bid = require("../models/bid");
const Listing = require("../models/listing");
const passport = require("passport");
const moment = require("moment");
const { isSignedIn } = require("../authenticate");
require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP address to 5 requests per windowMs
  message: "Too many password reset attempts please try again later"
});


// Function to send Welcome email
const sendWelcomeEmail = async (toEmail, name) => {
  const msg = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: "Welcome to Auctions WA",
    html: `<P>Hello ${name}, </p>
        <p>Thank you for joining Auctions WA! We are excited to have you on board.</p>
        <p>You can start browsing listings by visising <a href="http://localhost:3000/listings">Go to listings page</a>.</p>
        <p>Best regards, <br/> The Auctions WA Team</p>`,
  };

  let retryCount = 0;
  while (retryCount < 3) {
    try {
      await sgMail.send(msg);
      console.log("Email sent successfully!");
      return;
    } catch (error) {
      console.log(
        `Error sending email ${retryCount + 1} retries left: ${error}`
      );
      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for  seconds before retrying to send email again
    }
  }

  console.error("Maximum email sending attempts reached.");
};

/*This route will be used to render the register form for a user to register*/
router.get("/register", (req, res) => {
  res.render("users/register.ejs");
});

/*This route will be used to register a user thus submitting the user's details to the database*/
router.post("/register", async (req, res, next) => {
  try {
    const { firstname, lastname, email, username, number, password } = req.body;
    const user = new User({ firstname, lastname, email, username, number });
    // Register user through passport
    const registeredUser = await User.register(user, password);
    // Log in the newly registered user after registering useing passport
    // await sendWelcomeEmail(req.body.email, req.body.firstname);
    req.logIn(registeredUser, (err) => {
      if (err) {
        console.log(err);
        res.redirect("/login");
      } else {
        req.flash("success", "Welcome");
        res.redirect("/listings");
      }
    });
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/register");
  }
});

/*This route will be used to render the log in form for the user to log in*/
router.get("/login", (req, res) => {
  res.render("users/login");
});

/*This route will be used to log in the user by checking the provided details on the log in form correspond to the
 ones in the database*/
router.post("/login", passport.authenticate("local", {failureFlash: true, failureRedirect: "/login",}),(req, res) => {
    req.flash("success", "Welcome back");
    const redirectUrl = req.session.returnTo || "/listings";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  });

/*This route will be used to log out the user*/
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Goodbye!");
    res.redirect("/listings");
  });
});

// User profile management routes

// This will render the form with the user's personal details

router.get("/profile", isSignedIn, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.render("users/profile", { user });
});

// This route will post the users updates to the form
router.put("/profile/:id", isSignedIn, async (req, res) => {
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
});

// Function to format date using moment.js library
function formatDate(date) {
  return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

async function getBids(ownerId) {
  const bids = await Bid.find({ owner: ownerId }).populate("listing");
  const result = [];
  for (const bid of bids) {
    const listing = bid.listing;
    const highestBid = await Bid.find({ listing: listing })
      .sort({ bidAmount: -1 })
      .limit(1)
      .populate("owner");
    const now = new Date();
    const endTime = new Date(listing.endTime);
    let wonAuction;
    if (now > endTime) {
      wonAuction = highestBid[0].owner._id.toString() === ownerId.toString()
      ? "Won"
      : "Lost"
    } else {
      wonAuction = highestBid[0].owner._id.toString() === ownerId.toString()
        ? 'Auction still running and you are Winning'
        : 'Auction still running and you are Losing';
    }
    result.push({
      _id: bid._id,
      bidAmount: bid.bidAmount,
      date: formatDate(bid.date),
      listing: listing,
      image: listing.image,
      wonAuction: wonAuction,
    });
  }
  return result;
}


router.get("/bids", isSignedIn, async (req, res) => {
  try {
    const bids = await getBids(req.user._id);
    console.log(`This user has ${bids.length} bids`);
    res.render("users/bids", { bids });
  } catch (error) {
    console.log(error);
  }
});

router.get("/mylistings", isSignedIn, async(req, res) => {
  const currentUserId = req.user._id;
  // Find all the listings that have been posted by the currently logged in user
  const listings = await Listing.find({owner: currentUserId});
  res.render("users/mylistings", {listings});
  
})

// Route to render the password change form
router.get('/password', isSignedIn, (req, res) => {
  // Get the form data from the session
  const formData = req.flash("form")[0];

  res.render('users/changePassword', { formData });
});

// Route to handle the password change request
router.post('/change-password', isSignedIn, async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  const user = req.user;

  // Check if the new password and confirmation match
  if (newPassword !== confirmNewPassword) {
    // Handle password mismatch error
    req.flash("error", "Passwords do not match");

    // Store the form data in the session to prepopulate the form
    req.flash("form", { oldPassword, newPassword, confirmNewPassword });

    return res.redirect('/password');
  }

  try {
    // Use the `changePassword` method provided by Passport.js to change the user's password
    await user.changePassword(oldPassword, newPassword);

    // Redirect to success page
    req.flash("success", "Password changed successfully");
    return res.redirect('/profile');
  } catch (err) {
    // Handle password change error
    req.flash("error", "Incorrect password");

    // Store the form data in the session to prepopulate the form
    req.flash("form", { oldPassword, newPassword, confirmNewPassword });

    return res.redirect('/password');
  }
});



// Forgot password page
router.get('/forgot', (req, res) => {
  res.render('users/forgot');
});


// Process forgot password form
router.post('/forgot', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', 'Incorrect or invalid email address');
    return res.redirect('/forgot');
  }
  
  // Generate reset token
  user.generateResetToken();
  await user.save();
  
  // Send reset email
  const resetUrl = `http://${req.headers.host}/reset/${user.resetPasswordToken}`;
  const message = {
    to: user.email,
    from: process.env.EMAIL_FROM,
    subject: 'Password Reset Request',
    text: `Please click on the following link to reset your password: ${resetUrl}`,
    html: `<p>Please click on the following link to reset your password: <a href="${resetUrl}">${resetUrl}</a>. It will expire after an hour</p>`
  };
  
  await sgMail.send(message);
  req.flash('success', 'An email has been sent to your email address with further instructions.');
  res.redirect('/forgot');
});


// Reset password page
router.get('/reset/:token', resetPasswordLimiter, async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Password reset token is invalid or has expired.');
    return res.redirect('/forgot');
  }
  
  res.render('users/reset', { token: req.params.token });
});


// Process reset password form
router.post('/reset/:token', resetPasswordLimiter, async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    req.flash('error', 'Password reset token is invalid or has expired.');
    return res.redirect('/forgot');
  }
  
  // Update password
  await user.setPassword(req.body.password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  
  // Send confirmation email
  const message = {
    to: user.email,
    from: process.env.EMAIL_FROM,
    subject: 'Password Reset Confirmation',
    html: '<p>Your password has been successfully reset.</p>'
  };
  
  await sgMail.send(message);
  req.flash('success', 'Your password has been successfully reset.');
  res.redirect('/login');
});



module.exports = router;

