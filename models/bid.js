// A model for placing a bid and collecting information regarding the bid
const mongoose = require("mongoose");
const {Schema} = mongoose;
const Listing = require("./listing.js");
const User = require("./user");

const bidSchema = new Schema({

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
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