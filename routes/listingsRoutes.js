const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");


// Listings Routes

//Get all listings
router.get("/", async (req, res) => {
  const listings = await Listing.find({}).populate("bids");
  // for (let listing of listings) {
  //     listing.bids.sort((a, b) => b.bidAmount - a.bidAmount);
  //     listing.highestBid = listing.bids.length > 0 ? listing.bids[0].bidAmount : 0;
  //   }
  res.render("listings/index.ejs", { listings });
});


// Create a new listing
router.get("/new", async(req, res) => {
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);
  res.render("listings/new.ejs", {startTime, endTime});
});

// post the new listing to the database
router.post("/", async(req, res) => {
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);
  const listing = new Listing({startTime: startTime, listingName: req.body.listingName, description: req.body.description, image: req.body.image, price: req.body.price, condition: req.body.condition, owner: req.body.owner, endTime: endTime, location: req.body.location });
  await listing.save();
  req.flash("success", "Successfuly posted your listing!")
  res.redirect("/listings");
});

// Show the detailed information about the listing
router.get("/:id", async(req, res) => {
  const {id} = req.params;
  const listing = await Listing.findById(id).populate("bids");
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
router.get("/:id/edit", async(req, res) => {
  const{id} = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit", {listing});
});

// Update a listing
router.put("/:id", async(req, res) => {
  const {id} = req.params;
  const listing = await Listing.findByIdAndUpdate(id, req.body);
  res.redirect(`/listings/${listing._id}`);
});

router.delete("/:id", async(req, res) => {
  const {id} = req.params;
  const listing = await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
});

module.exports = router