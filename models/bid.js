// A model for placing a bid and collecting information regarding the bid
const mongoose = require("mongoose");
const {Schema} = mongoose;
const Listing = require("./listing.js");

const bidSchema = new Schema({
    // Later change this to reference the users
    bidderName: {
        type: String,
        required: [true, "Name of the bidder must be supplied"]
    },

    bidAmount: {
        type: Number,
        required: [true, "The bidding amount must be supplied"]
    },

    date: {
        type: String,
        default: Date.now
    }

    
});

const Bid = mongoose.model("Bid", bidSchema);

module.exports = Bid;

// listing: {
//     type: Schema.Types.ObjectId,
//     ref: 'Listing',
//     required: true
//   },