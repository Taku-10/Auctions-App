const express = require("express");
const router = express.Router({mergeParams: true});
const Listing = require("../models/listing");
const Watchlist = require("../models/watchlist");
const User = require("../models/user");
const{isSignedIn} = require("../authenticate");


// Watchlist routes
router.get("/", isSignedIn, async (req, res) => {
    try {
      const watchlist = await Watchlist.find({ owner: req.user._id })
        .populate({
          path: 'listing',
          populate: { path: 'owner' }
        })
        .populate('owner');
      res.render('listings/watchlist', { watchlist });
    } catch (err) {
      console.log(err);
      res.status(500).send('Server Error');
    }
  });
  
  router.post("/add", isSignedIn, async (req, res) => {
    if (!req.user) {
      // If the user is not authenticated, redirect to the login page
      return res.redirect('/login');
    }
  
    const userId = req.user._id;
    const listingId = req.body.listingId;
  
    // Check if the user already has the same listing in their watchlist
    const watchlist = await Watchlist.findOne({ owner: userId, listing: listingId });
    if (watchlist) {
      // If the user already has the same listing in their watchlist, display an appropriate message
      return res.send('You have already added this listing to your watchlist');
    }
  
    // If the user does not have the same listing in their watchlist, create a new watchlist item
    const newWatchlistItem = new Watchlist({
      owner: userId,
      listing: listingId,
    });
  
    // Save the new watchlist item to the database
    try {
      await newWatchlistItem.save();
      req.flash("success", "Listing added to your watchlist");
      res.redirect("/watchlist");
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal server error');
    }
  });
  
  // Route to delete a listing from a user's watchlist
  router.delete("/:id", isSignedIn, async (req, res) => {
    try {
      const watchlistItem = await Watchlist.findOneAndDelete({ owner: req.user._id, listing: req.params.id });
      if (!watchlistItem) {
        return res.status(404).send('Watchlist item not found');
      }
      res.redirect('/watchlist');
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal server error');
    }
  });

  module.exports = router;