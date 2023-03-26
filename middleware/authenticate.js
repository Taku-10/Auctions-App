const express = require("express");
const Listing = require("../models/listing");
const rateLimit = require("express-rate-limit");

const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP address to 5 requests per windowMs
    message: "Too many password reset attempts please try again later"
  });
  

const isSignedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    req.flash("error", "You must be signed in !");
    return res.redirect("/login");
    
}

const isOwner = async(req, res, next) => {
    const { id } = req.params;
    // Find the listing from the database by it's id
    const listing = await Listing.findById(id);
    // Check to see if the owner's id of that listing is the same as the currently logged in user's id
    if (!listing.owner.equals(req.user._id)) {
        req.flash("error", "You do not have permission to do that!");
        res.redirect(`/listings/${listing._id}`);
    }
    // The owner of that listing id matches the id of the currently logged in user
    return next();
  };

  
  module.exports = {
    isOwner,
    isSignedIn,
    resetPasswordLimiter
  };