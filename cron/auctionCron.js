if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const Listing = require("../models/listing");
const Bid = require("../models/bid");
const User = require("../models/user");
const sendEmail = require("../utilities/sendEmail");
const moment = require("moment");
const { formatDate } = require("../utilities/BidOutcome");

  
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
      const date = listing.date;
      const formattedDate = formatDate(date);
      if (bids.length > 0) {
        const winner = await User.findById(bids[0].owner);

        const subject = `Congratulations! You Won the Auction for ${listing.title}`;
        const message = `

        <p>Dear ${winner.firstname}</p>,
        <p>We're excited to let you know that you've won the auction for ${listing.title} on Bid Mart!</p>
        <p>Congratulations on your successful bid and thank you for participating in the auction</p>
        <hr>
        <p>Here are the details of your winning bid:</p>
        <p>Item: ${listing.title}</p>
        <p>Bid Amount: $${bids[0].bidAmount}</p>
        <p>Auction end time: ${formattedDate }</p>
        <hr>
        <p>We will now be contacting the seller to confirm the availability of the item. Once we receive confirmation from the seller, we will send you another email with their contact details so that you can arrange payment and shipping.</p>
        <p>We ask for your patience in this process as we work to ensure a smooth and secure transaction for both you and the seller.</p>
        <p>Once you have successfully completed the transaction, please let us know by replying to this email. This will help us ensure a smooth and secure transaction for both you and the seller.</p>
        <p>Thank you for choosing Bid Mart, and we hope you enjoy your new ${listing.title}.</p>
        <p>Best regards,</p>
        <p>The Bid Mart Team</p> 
        
        `;

        await sendEmail(winner.email, subject, message);
        
      }
    }
}

module.exports = checkAndEndAuctions