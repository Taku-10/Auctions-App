// Model for a listing to post that is up for auction and open to bids

const mongoose = require("mongoose");
const Bid = require("./bid");
const User = require("./user");
const Admin = require("./admin");
const {Schema} = mongoose;



const listingSchema = new Schema({
    startTime: {
        type: String,
        required: true
    },

    title: {
        type: String,
        required: [true, "Title must be provided"],
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    image: {
        type: String,
        required: [true, "Image of the product must be supplied"]
    },

    price: {
        type: String,
        required: [true, "Price must be provided"]
    },

    condition: {
        type: String, 
        enum: ["New", "Used-like new", "Used-good", "Used-fair"],
        required: [true, "Condition of the product must be supplied"]
    },
    
    category: {
        type: String,
        enum: ["Home & Garden", "Entertainment", "Clothing and accessories", "Electronics", "Sports and outdoors"],
        required: [true, "Category must be selecetd"]
    },

    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"

    },
    
    endTime: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: [true, "The location of your listing must be supplied"]
    },

    bids: [
        {
            type: Schema.Types.ObjectId,
            ref: "Bid"
        }
    ],

    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending",
    },

    handledBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
    }

});

listingSchema.index({listingName: "text", description: "text"});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
