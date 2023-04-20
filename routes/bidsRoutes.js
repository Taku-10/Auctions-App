if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const router = express.Router({ mergeParams: true });
const Bid = require("../models/bid");
const Listing = require("../models/listing");
const User = require("../models/user");
const { isSignedIn } = require("../middleware/authenticate");
const twilioClient = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const sendTextMessage = require("../utilities/sendTextMessage");
const catchAsync = require("../utilities/catchAsync");
const sendEmail = require("../utilities/sendEmail");

router.post(
  "/",
  isSignedIn,
  catchAsync(async (req, res) => {
    // bFind the listing for which the bid is being placed for by it's id in the database
    const listing = await Listing.findById(req.params.id);
    //Find the starting price for that listing that has been set by the owner of the listing
    const startingPrice = listing.price;
    // Find the existing bids that have been placed for that listing
    const currentBids = await Bid.find({ _id: { $in: listing.bids } });
    // Find the current highest bid that has been placed for that listing
    const currentMaxBid = currentBids.reduce(
      (max, bid) => (bid.bidAmount > max ? bid.bidAmount : max),
      startingPrice
    );

    console.log(currentMaxBid);
    // Check if bid being placed is greater than the current Maximum Bid for that listing
    if (req.body.bidAmount < currentMaxBid) {
      req.flash(
        "error",
        "Bid must be greater than or equal to the current highest bid/starting price"
      );
      res.redirect(`/listings/${listing._id}`);
    } else {
      // Create a new bid
      const bid = new Bid(req.body);
      bid.date = new Date();
      // Set the owner of the bid to be the currently logged in user
      bid.owner = req.user._id;
      // Set the listing for which the bid is for
      bid.listing = listing._id;
      // Push the new bid to the listings array
      listing.bids.push(bid);
      // save the new bid
      await bid.save();
      // save the listing
      await listing.save();
      req.flash("success", "Bid successfully placed");

      // Notify previous highest bidder if they exist
      const previousMaxBid = currentBids.length > 0 ? currentBids[0] : null;
      if (previousMaxBid) {
        const previousMaxBidOwner = await User.findById(previousMaxBid.owner);
        const auctionURL = `https://still-refuge-95536.herokuapp.com/listings/${listing._id}`;
        const subject = "You have been outbid on an auction";
        const message = `<p>Dear ${previousMaxBidOwner.firstname} ${previousMaxBidOwner.lastname}</p>
        <p>We regret to inform you that you have been outbid on the auction for ${listing.title}.</p>
        <p>The current highest bid for the item is now $${req.body.bidAmount}.</p>
        <p>If you are interested in winning the auction, you may place another bid by visiting <br> the auction page here: ${auctionURL}.</p>
        <p>If you choose not to place another bid, we thank you for your participation in the auction and <br> encourage you to keep an eye out for other great deals on our platform. </p>
        <hr>
        <p>Best regards,</p>
        <p>The Bid Mart Team</p>`;

        await sendEmail(previousMaxBidOwner.email, subject, message);
        // const message = `Hi ${previousMaxBidOwner.firstname}. You have been outbid on the auction of ${listing.title}. The new highest bid is $${req.body.bidAmount}.`;
        // await sendTextMessage(previousMaxBidOwner.number, message);
      }

      res.redirect("/listings");
    }
  })
);

module.exports = router;

