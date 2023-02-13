const express = require("express");
const router = express.Router();
const Bid = require("../models/bid");
const Listing = require("../models/listing");

router.post("/", async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const startingPrice = listing.price;
    const currentBids = await Bid.find({ _id: { $in: listing.bids } });
    const currentMaxBid = currentBids.reduce((max, bid) => (bid.bidAmount > max ? bid.bidAmount : max), 0);

    if (listing.bids.length === 0) {
        if (req.body.bidAmount >= startingPrice) {
            const bid = new Bid(req.body);
            listing.bids.push(bid);
            await bid.save();
            await listing.save();
            res.redirect("/listings");
        } 
        else {
            return res.status(400).send("Bid amount must be greater than or equal to the starting price.");
        }
    }
    else {
        if (req.body.bidAmount <= currentMaxBid) {
            return res.status(400).send("Bid amount must be higher than current highest bid.");
          }
          else {
            const bid = new Bid(req.body);
            listing.bids.push(bid);
            await bid.save();
            await listing.save();
            res.redirect("/listings");
          }
    }

  });

module.exports = router;

