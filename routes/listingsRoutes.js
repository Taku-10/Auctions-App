if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const router = express.Router({ mergeParams: true });
const Listing = require("../models/listing");
const User = require("../models/user");
const {isSignedIn, isOwner, resetPasswordLimiter} = require("../middleware/authenticate");
const mbxGeocoding = require ("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geoCoder = mbxGeocoding({accessToken: mapBoxToken});
const multer = require("multer");
const {storage} = require("../cloudinary/index");
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5, //limit file size to 5mb
    files: 4 // limit number of files to 5
  }
})


/*This route retrieves all the Listings that have been posted by users and approved by the admins*/
router.get("/", async (req, res) => {
  // Retrieve all the listings from the database
  const listings = await Listing.find({})
    .populate("owner")
    .populate({ path: "bids", populate: { path: "owner" } });
  res.render("listings/index.ejs", { listings });
});

/*This route will be used to just a render a form to users to create a new listing and it has the isSignedIn middleware
that protects it. A user has to be authenticated(signed in) inorder to access it */
router.get("/new", isSignedIn, async (req, res) => {
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 5 * 60 * 1000); // 5 minutes
  res.render("listings/new.ejs", { startTime, endTime });
});

/*This route will be used to post the listing created by a user to the database and it has the isSignedIn middleware
that protects it. A user has to be authenticated(signed in) inorder to access it*/
router.post("/", isSignedIn, upload.array("image"), async (req, res) => {
  try {
    const geoData = await geoCoder.forwardGeocode({
      query: req.body.location,
      limit: 1
    }).send()

    const startTime = new Date();
    // Set endTime when the auction ends to be 48 hours from the moment its posted
    // const endTime = new Date(startTime.getTime() + 48 * 60 * 60 * 1000); // 48 Hours
    const endTime = new Date(startTime.getTime() + 5 * 60 * 1000); // 5 minutes
    //const endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
    const listing = new Listing({
      startTime: startTime,
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      price: req.body.price,
      condition: req.body.condition,
      endTime: endTime,
      location: req.body.location,
    });
    listing.images = req.files.map(f =>({url: f.path, filename: f.filename}));
    listing.geometry = geoData.body.features[0].geometry;
    listing.owner = req.user._id; // Current person logged in
    await listing.save();
    req.flash("success", "Successfuly posted your listing!");
    res.redirect("/listings");
  } catch (error) {
    console.log(error); // Log the error to the console for debugging purposes
    req.flash("error", "Failed to geocode location. Please enter a valid location.");
    res.redirect("/listings/new"); // Redirect the user to the new listing page to try again
  }
});


/*This route will be used to display more detailed information about a specific listing*/
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  // Find the specidic listing from the databas eby it's id
  const listing = await Listing.findById(id)
    .populate("bids")
    .populate({ path: "owner", model: "User" })
    .populate({ path: "bids", populate: { path: "owner", model: "User" } });
  const startTime = listing.startTime;
  const endTime = listing.endTime;
  // Get the summary information for a listing's bids
  const bids = listing.bids;
  let uniqueBidders = [];
  let numBids = 0;

  for (const bid of bids) {
    // Check to see if the uniqueBidders array constains the bidders id
    if (!uniqueBidders.includes(bid.owner._id)) {
      //If it does not include the add the bidder's id to the array;
      uniqueBidders.push(bid.owner._id);
    }
    numBids++;
  }
  // Number of unique bidders
  let numBidders = uniqueBidders.length;

  res.render("listings/show.ejs", {
    listing,
    startTime,
    endTime,
    numBidders,
    numBids,
  });
});

/*The route will be used to just render the form to edit a listing and it has the isSignedIn middleware
that protects it. A user has to be authenticated(signed in) inorder to access it. It also has the isOwner
middleware which only authorizes the owner of that listing to upadate it*/
router.get("/:id/edit", isSignedIn, isOwner, async (req, res) => {
  const { id } = req.params;
  // Find the listing from the databse by it's specific id
  const listing = await Listing.findById(id);
  // Check if the listing exists
  if (!listing) {
    req.flash("error", "Cannot find that listing");
    return res.redirect("/listings");
  }
  res.render("listings/edit", { listing });
});

/*Thos route will be used to update the listing and post to the database. and it has the isSignedIn middleware
that protects it. A user has to be authenticated(signed in) inorder to access it. It also has the isOwnwer middleware protecting
it which ensures that only the owner of that listing is authorized to update the listing*/
router.put("/:id", isSignedIn, isOwner, upload.array("image"), async (req, res) => {
  const { id } = req.params;
  // Find the listing from the database by it's specific id and then update it
  const listing = await Listing.findByIdAndUpdate(id, req.body);
  const images = req.files.map(f =>({url: f.path, filename: f.filename}));
  listing.images.push(...images);
  await listing.save();
  req.flash("success", "Successfully update the listing");
  res.redirect(`/listings/${listing._id}`);
});

/*This route will be used to delete a listing from the database and it has the isSignedIn middleware
that protects it. A user has to be authenticated(signed in) inorder to access it. It also has the isOwner 
middleware protecting it which ensures that only the owner of that listing is authorized to delete the listing*/
router.delete("/:id", isSignedIn, isOwner, async (req, res) => {
  const { id } = req.params;
  // Find the listing to be deleted from the database by it's specific id and then delete it
  const listing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Successfully deleted your listing");
  res.redirect("/listings");
});

/* This route will be used to reList an listing that was previsouly listed but not sold. It will be reListed as 
it is. The route is also protected by the isSignedIn middleware which ensures that a user has to be authenticated(signed in)
inorder to access it*/
router.post("/:id/relist", isSignedIn, async (req, res) => {
  // Find the listing reList the specific id
  const listing = await Listing.findById(req.params.id);
  // Check if the listing exists
  if (!listing) {
    req.flash("error", "Listing not found.");
  }
  // Check if the listing has no bids
  // Should never happen, it's being handled in the ejs template to hide and show the relist btn
  if (listing.bids.length > 0) {
    return res.status(400).send("Cannot relist a listing with bids.");
  }
  // Relist for 48 hours
  listing.endTime = new Date(Date.now() + 5 * 60 * 60 * 1000);
  await listing.save();
  req.flash("success", "Listing successfully relisted!");
  res.redirect("/listings");
});

module.exports = router;
