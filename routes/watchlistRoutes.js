const express = require("express");
const router = express.Router({ mergeParams: true });
const Listing = require("../models/listing");
const Watchlist = require("../models/watchlist");
const User = require("../models/user");
const { isSignedIn } = require("../middleware/authenticate");
const catchAsync = require("../utilities/catchAsync");

router.get('/', isSignedIn, catchAsync(async (req, res) => {
  const watchlist = await Watchlist.find({owner: req.user._id}).populate('listing');
  const validItems = watchlist.filter(item => item.listing !== null && item.listing !== undefined);
  res.render('listings/watchlist', {watchlist: validItems});
}));

/*This route will be used to get all the listings that a user added to their watchlist and it has the isSignedIn middleware
that protects it. A user has to be authenticated(signed in) inorder to access it*/
router.get("/", isSignedIn, catchAsync(async (req, res) => {
    // Find from all the listings that are in the currently logged in user's Watchlist.
    const watchlist = await Watchlist.find({ owner: req.user._id })
      .populate({
        path: "listing",
        populate: { path: "owner" },
      })
      .populate("owner");
      const validItems = watchlist.filter(item => item.listing !== null && item.listing !== undefined);
    res.render("listings/watchlist", { watchlist: validItems });
}));

/*This route will be used to post a listing to a user's Watchlist and it has the isSignedIn middleware
that protects it. A user has to be authenticated(signed in) inorder to access it*/
router.post("/add", isSignedIn, catchAsync(async (req, res) => {
  if (!req.user) {
    // If the user is not authenticated, redirect to the login page
    return res.redirect("/login");
  }

  const userId = req.user._id;
  const listingId = req.body.listingId;

  // Check if the user is the owner of the listing
  const listing = await Listing.findById(listingId);
  if (listing.owner === userId) {
    // If the user is the owner of the listing, display an appropriate message
    req.flash("error", "You cannot add your own listing to your watchlist");
    return res.redirect("/listings");
  }

  // Check if the user already has the same listing in their watchlist
  const watchlist = await Watchlist.findOne({
    owner: userId,
    listing: listingId,
  });
  if (watchlist) {
    // If the user already has the same listing in their watchlist, display an appropriate message
    req.flash("error", "You have already added this listing to your watchlist");
    return res.redirect("/watchlist");
  }

  // If the user does not have the same listing in their watchlist and is not the owner of the listing, create a new watchlist item
  const newWatchlistItem = new Watchlist({
    owner: userId,
    listing: listingId,
  });

  // Save the new watchlist item to the database
  await newWatchlistItem.save();
  req.flash("success", "Listing added to your watchlist");
  res.redirect("/watchlist");
}));




/*This route will be used to delete a listing from a user's watchlist and it has the isSignedIn middleware
that protects it. A user has to be authenticated(signed in) inorder to access it*/
router.delete("/:id", isSignedIn, catchAsync(async (req, res) => {
  // Find the listing from a user's Watchlist by it's specific id and with the currently logged in user's id
  const watchlistItem = await Watchlist.findOneAndDelete({
    owner: req.user._id,
    listing: req.params.id,
  });
  // Check if the listing is there
  if (!watchlistItem) {
    req.flash("error", "Watchlist item not found");
    res.redirect("/listings");
  }
  req.flash("success", "Deleted listing from your watchlist");
  res.redirect("/watchlist");
}));


module.exports = router;
