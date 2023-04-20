const express = require("express");
const moment = require("moment");
const Bid = require("../models/bid");
const Listing = require("../models/listing");
const DeletedListing = require("../models/deletedListing");
const User = require("../models/user");

// Function to format date using moment.js library
function formatDate(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
  }

  async function getBids(ownerId) {
    const bids = await Bid.find({ owner: ownerId }).populate("listing");
    const result = [];
    for (const bid of bids) {
      let listing = bid.listing;
      let highestBid;
      let wonAuction;
      if (!listing) {
        // If the listing has been deleted, look for its information in the deletedListing collection
        const deletedListing = await DeletedListing.findById(bid.listingRef);
        if (!deletedListing) {
          // If the listing cannot be found, skip this bid
          continue;
        }
        // If the listing is found, use its information instead
        listing = deletedListing.toObject();
        highestBid = await Bid.find({ listing: listing._id })
          .sort({ bidAmount: -1 })
          .limit(1)
          .populate("owner");
        wonAuction = "Listing deleted";
      } else {
        highestBid = await Bid.find({ listing: listing })
          .sort({ bidAmount: -1 })
          .limit(1)
          .populate("owner");
        const now = new Date();
        const endTime = new Date(listing.endTime);
        if (now > endTime) {
          wonAuction =
            highestBid[0].owner._id.toString() === ownerId.toString()
              ? "Won"
              : "Lost";
        } else {
          wonAuction =
            highestBid[0].owner._id.toString() === ownerId.toString()
              ? "In progress. Winning"
              : "In progress. Losing";
        }
      }
      result.push({
        _id: bid._id,
        bidAmount: bid.bidAmount,
        date: formatDate(bid.date),
        listing: listing,
        image: listing.images[0].url,
        wonAuction: wonAuction,
      });
    }
    return result;
  }
  

  module.exports = {
    formatDate,
    getBids,
  };