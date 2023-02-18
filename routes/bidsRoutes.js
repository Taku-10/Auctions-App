const express = require("express");
const router = express.Router({mergeParams: true});
const Bid = require("../models/bid");
const Listing = require("../models/listing");
const{isSignedIn} = require("../authenticate");


router.post("/", isSignedIn, async (req, res) => {
  // Find the listing for which the bid isbeing placed for by it's id in the database
  const listing = await Listing.findById(req.params.id);
  //Find the starting price for that listing that has been set by the owner of the listing
  const startingPrice = listing.price;
  // Find the existing bids that have been placed for that listing
  const currentBids = await Bid.find({ _id: { $in: listing.bids } });
  // Find the current highest bid that has been placed for that listing
  const currentMaxBid = currentBids.reduce((max, bid) => (bid.bidAmount > max ? bid.bidAmount : max), 0);


   /* Check to see if there are any bids that have been placed already for that listing and if there are no bids yet
   and it's the first bid then check to see if the amount being placed is greater than or equal to the 
  the starting price(set by the owner) */
  if (listing.bids.length === 0) {
    if (req.body.bidAmount >= startingPrice) {
      // Create a new bid
      const bid = new Bid(req.body);
      // Set the owner of the bid to be the currently logged in user
      bid.owner = req.user._id;
      // Push the bid for that listing into the array for that listing's bids
      listing.bids.push(bid);
      // Save the bid
      await bid.save();
      // Save the listing
      await listing.save();
      req.flash("success", "Bid successfully placed");
      res.redirect("/listings");
        } // If the bid amount is less than the starting price set by the owner
        else {
            req.flash("error", "Bid amount must be greater than or equal to the starting price.");
        }
    }
    // If there are bids placed already on that listing and the amount being placed is less than the current highest bid
    else {
        if (req.body.bidAmount <= currentMaxBid) {
            req.flash("error", "Bid amount must be higher than current highest bid.");
          } // The bid amount is greater than or equal to the current highest bid
          else {
            // Create the bid
            const bid = new Bid(req.body);
            // Set the owner of that bid to be equal to the currently logged in user
            bid.owner = req.user._id;
            // push the bid to the listing.bids array
            listing.bids.push(bid);
            //save the bid
            await bid.save();
            // save the listing
            await listing.save();
            req.flash("success", "Bid successfully placed")
            res.redirect("/listings");
          }
    }

  });

module.exports = router;

