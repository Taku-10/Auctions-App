const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const Bid = require("./models/bid");
const methodOverride = require("method-override");
// const listingsRoutes = require("./routes/listingsRoutes");

// const Campground = require("./models/campground");
const ejsMate = require("ejs-mate");
// const catchAsync = require("./Utilities/catchAsync");
// const AppError = require("./Utilities/AppError");
// const Joi = require("joi");
// const {campgroundSchema} = require("./schemas.js")
// const Review = require("./models/review");
const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/Auctions')
    .then(()=> {
        console.log("Mongo Connection open");
    })
    .catch(err => {
        console.log("Mongo connection error");
        console.log(err);
    })


app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({extended: true}))
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("home.ejs");
});

// Listings Routes

//Get all listings
app.get("/listings", async (req, res) => {
    const listings = await Listing.find({}).populate("bids");
    // for (let listing of listings) {
    //     listing.bids.sort((a, b) => b.bidAmount - a.bidAmount);
    //     listing.highestBid = listing.bids.length > 0 ? listing.bids[0].bidAmount : 0;
    //   }
    res.render("listings/index.ejs", { listings });
  });
  

// Create a new listing
app.get("/listings/new", async(req, res) => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);
    res.render("listings/new.ejs", {startTime, endTime});
});

// post the new listing to the database
app.post("/listings", async(req, res) => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000);
    const listing = new Listing({startTime: startTime, listingName: req.body.listingName, description: req.body.description, image: req.body.image, price: req.body.price, condition: req.body.condition, owner: req.body.owner, endTime: endTime, location: req.body.location });
    await listing.save();
    res.redirect("/listings");
});

// Show the detailed information about the listing
app.get("/listings/:id", async(req, res) => {
    const {id} = req.params;
    const listing = await Listing.findById(id).populate("bids");
    const startTime = listing.startTime;
    const endTime = listing.endTime;

    // Auction Summary
    const bids = listing.bids;
    let uniqueBidders = [];
    let numBids = 0;

    for (const bid of bids) {
        if (!uniqueBidders.includes(bid.bidderName)) {
            uniqueBidders.push(bid.bidderName);
        }
        numBids++;
    }

    let numBidders = uniqueBidders.length;

    res.render("listings/show.ejs", {listing, startTime, endTime, numBidders, numBids});
});

//Get the update a listing form
app.get("/listings/:id/edit", async(req, res) => {
    const{id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit", {listing});
});

// Update a listing
app.put("/listings/:id", async(req, res) => {
    const {id} = req.params;
    const listing = await Listing.findByIdAndUpdate(id, req.body);
    res.redirect(`/listings/${listing._id}`);
});

app.delete("/listings/:id", async(req, res) => {
    const {id} = req.params;
    const listing = await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
});

app.post("/listings/:id/bids", async (req, res) => {
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
  
app.listen(3000, () => {
    console.log("Tiripo pa port 3000");
});

/*
// Working version
app.post("/listings/:id/bids", async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    const startingPrice = listing.price;
    const currentBids = await Bid.find({ _id: { $in: listing.bids } });
    const currentMaxBid = currentBids.reduce((max, bid) => (bid.bidAmount > max ? bid.bidAmount : max), 0);
  
    if (req.body.bidAmount <= currentMaxBid) {
      return res.status(400).send("Bid amount must be higher than current highest bid.");
    }
  
    const bid = new Bid(req.body);
    listing.bids.push(bid);
    await bid.save();
    await listing.save();
    res.redirect("/listings");
  });
  
*/

// app.post("/listings/:id/bids", async (req, res) => {
//     const listing = await Listing.findById(req.params.id);
//     const startingPrice = listing.price;
//     const currentHighestBid = listing.bids.reduce((prev, curr) => {
//       return (prev.bidAmount > curr.bidAmount) ? prev : curr;
//     }, { bidAmount: 0 });

//     if (req.body.bidAmount > currentHighestBid.bidAmount) {
//         const bid = new Bid(req.body);
//         listing.bids.push(bid);
//         await bid.save();
//         await listing.save();
//         res.redirect("/listings");

