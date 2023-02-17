// Model for a listing to post that is up for auction and open to bids

const mongoose = require("mongoose");
const Bid = require("./bid");
const User = require("./user");
const {Schema} = mongoose;



const listingSchema = new Schema({
    startTime: {
        type: String,
        required: true
    },

    listingName: {
        type: String,
        required: [true, "Product Name must be provided"]
    },

    description: {
        type: String,
        required: [true, "The description must be provided"]
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
        enum: ["New", "Refurbished", "Old"],
        required: [true, "Condition of the product must be supplied"]
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
        enum: ["Pending", "Approved"],
        default: "Pending",
    }
        
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;



// app.post("/campgrounds/:id/reviews", catchAsync(async(req, res) => {
//     const campground = await Campground.findById(req.params.id);
//     const review = new Review(req.body);
//     campground.reviews.push(review);
//     await review.save();
//     await campground.save();
//     res.redirect(`/campgrounds/${campground._id}`);
// }));
