const express = require("express");
const router = express.Router({ mergeParams: true });
const Bid = require("../models/bid");
const Listing = require("../models/listing");
const User = require("../models/user");
const { isSignedIn } = require("../authenticate");

require("dotenv").config();
const twilioClient = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


const sendSMSNotification = async(toNumber, body) => {
  try {
    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      body,
      to: toNumber
    });
    console.log(`SMS notification sent to ${toNumber}: ${message.sid}`)

  } catch (error) {
    console.log(`Error sending SMS notification to ${toNumber}: ${error}`);
  }
}

router.post("/", isSignedIn, async (req, res) => {
  // bFind the listing for which the bid is being placed for by it's id in the database
  const listing = await Listing.findById(req.params.id);
  //Find the starting price for that listing that has been set by the owner of the listing
  const startingPrice = listing.price;
  // Find the existing bids that have been placed for that listing
  const currentBids = await Bid.find({ _id: { $in: listing.bids } });
  // Find the current highest bid that has been placed for that listing
  const currentMaxBid = currentBids.reduce((max, bid) => (bid.bidAmount > max ? bid.bidAmount : max), startingPrice
  );

  console.log(currentMaxBid);
  // Check if bid being placed is greater than the current Maximum Bid for that listing
  if (req.body.bidAmount < currentMaxBid) {
    return res.status(400).send("Bid amount must be higher than current highest bid.");
  }

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
    const message = `Hi ${previousMaxBidOwner.firstname}. You have been outbid on the auction of ${listing.title}. The new highest bid is $${req.body.bidAmount}.`;
    // await sendSMSNotification(previousMaxBidOwner.number, message);
  }

  res.redirect("/listings");
});

module.exports = router;