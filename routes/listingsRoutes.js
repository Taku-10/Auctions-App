const express = require("express");
const router = express.Router({mergeParams:true});
const Listing = require("../models/listing");
const{isSignedIn} = require("../authenticate");

const isOwner = async(req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing.owner.equals(req.user._id)) {
      req.flash("error", "You do not have permission to do that!");
      res.redirect(`/listings/${listing._id}`);
  }
  return next();
}

//Get all listings
router.get("/", async(req, res) => {
  const listings = await Listing.find({}).populate("owner").populate({path: "bids", populate: {path: "owner"}});
  res.render("listings/index.ejs", { listings });
});

// Create a new listing
router.get("/new", isSignedIn, async(req, res) => {
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);
  res.render("listings/new.ejs", {startTime, endTime});
});

// post the new listing to the database
router.post("/", isSignedIn, async(req, res) => {
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);
  const listing = new Listing({startTime: startTime, listingName: req.body.listingName, description: req.body.description, image: req.body.image, price: req.body.price, condition: req.body.condition, endTime: endTime, location: req.body.location });
  listing.owner = req.user._id; // Current person logged in
  await listing.save();
  req.flash("success", "Successfuly posted your listing!")
  res.redirect("/listings");
});

// Show the detailed information about the listing
router.get("/:id", async(req, res) => {
  const {id} = req.params;
  const listing = await Listing.findById(id).populate("bids").populate("owner");
  const startTime = listing.startTime;
  const endTime = listing.endTime;

  // Auction Summary
  const bids = listing.bids;
  let uniqueBidders = [];
  let numBids = 0;

  for (const bid of bids) {
      if (!uniqueBidders.includes(bid.bidderName)) {
          uniqueBidders.push(bid.bidderName);
      }
      numBids++;
  }

  let numBidders = uniqueBidders.length;

  res.render("listings/show.ejs", {listing, startTime, endTime, numBidders, numBids});
});

//Get the update a listing form
router.get("/:id/edit", isSignedIn, isOwner, async(req, res) => {
  const{id} = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Cannot find that listing");
    return res.redirect("/listings");
  }
  res.render("listings/edit", {listing});
});

// Update a listing
router.put("/:id", isSignedIn, isOwner, async(req, res) => {
  const {id} = req.params;
  const listing = await Listing.findByIdAndUpdate(id, req.body);
  res.redirect(`/listings/${listing._id}`);
});

router.delete("/:id", isSignedIn, isOwner, async(req, res) => {
  const {id} = req.params;
  const listing = await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
});



module.exports = router