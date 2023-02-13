const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const Bid = require("./models/bid");
const methodOverride = require("method-override");
const listingRoutes = require("./routes/listingsRoutes");
const bidRoutes = require("./routes/bidsRoutes");

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
app.use("/listings", listingRoutes);
app.use("/listings/:id/bids", bidRoutes);
app.get("/", (req, res) => {
    res.render("home.ejs");
});
 
app.listen(3000, () => {
    console.log("Tiripo pa port 3000");
});
