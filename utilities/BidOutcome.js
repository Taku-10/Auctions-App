const express = require("express");
const moment = require("moment");
const Bid = require("../models/bid");
const Listing = require("../models/listing");
const User = require("../models/user");

// Function to format date using moment.js library
function formatDate(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
  }

async function getBids(ownerId) {
    const bids = await Bid.find({ owner: ownerId }).populate("listing");
    const result = [];
    for (const bid of bids) {
      const listing = bid.listing;
      const highestBid = await Bid.find({ listing: listing })
        .sort({ bidAmount: -1 })
        .limit(1)
        .populate("owner");
      const now = new Date();
      const endTime = new Date(listing.endTime);
      let wonAuction;
      if (now > endTime) {
        wonAuction = highestBid[0].owner._id.toString() === ownerId.toString()
        ? "Won"
        : "Lost"
      } else {
        wonAuction = highestBid[0].owner._id.toString() === ownerId.toString()
          ? 'Auction still running and you are Winning'
          : 'Auction still running and you are Losing';
      }
      result.push({
        _id: bid._id,
        bidAmount: bid.bidAmount,
        date: formatDate(bid.date),
        listing: listing,
        image: listing.image,
        wonAuction: wonAuction,
      });
    }
    return result;
  }

  module.exports = {
    formatDate,
    getBids,
  };