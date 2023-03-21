const Listing = require("../models/listing");
const Bid = require("../models/bid");
const User = require("../models/user");
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
  
  
const checkAndEndAuctions = async () => {
  // console.log("Running check And End Auctions function...........")
  // Get all listings with an auctionStatus of Open and whose end date is less than or equal to the current date
  const now = new Date();
  const listings = await Listing.find({auctionStatus: "Open", endTime: {$lte: now}});

  // console.log(`Found ${listings.length} listings to update`);
  
    // For each open listing whose auctions has ended, set the auction status to closed
    for (const listing of listings) {
      // console.log(`Updating listing ${listing._id}......`)
      listing.auctionStatus = "Closed";
      await listing.save();

      // console.log(`Listing ${listing._id} updated to Closed status......`);
      // Find the winner of the auction
      const bids = await Bid.find({_id: {$in: listing.bids}}).sort("-bidAmount");

      if (bids.length > 0) {
        const winner = await User.findById(bids[0].owner);
        const message = `Hi ${winner.firstname}. Congratulations! You have won the auction for ${listing.title} with a bid of $${bids[0].bidAmount}. Please contact the seller to arrange payment and delivery.`
        await sendSMSNotification(winner.number, message);
      }
    }
}

module.exports = checkAndEndAuctions