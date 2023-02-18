const express = require("express");
const router = express.Router({mergeParams:true});
const User = require("../models/user");
const Listing = require("../models/listing");
const passport= require("passport");

// Get all listing with pending status
router.get("/listings", async(req, res) => {
    const listings = await Listing.find({status: "Pending"}).populate("owner");
    if (!listings) {
        req.flash("error", "All listings are approved!");
    }
    else {
        res.render("admin/listings", {listings});
    }

  });
  
  // Show detailed information about a listing
router.get("/listings/:id", async(req, res) => {
    const {id} = req.params;
    const listing = await Listing.findById(id).populate("owner").populate("bids");
    res.render("admin/show", {listing});
  })
  
router.post("/listings/:id/approve", async(req, res) => {

    const {id} = req.params;
    const listing = await Listing.findById(id);

    if (!listing) 
    {
        req.flash("error", "No listing found");
        res.redirect("/admin/listings")
    }

    listing.status = "Approved";
    await listing.save();
    req.flash("success", "Listing approved successfully");
    res.redirect("/admin/listings");
      
  })
  
router.post("/listings/:id/reject", async(req, res) => {
    
    const {id} = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "No listing found");
      res.redirect("/admin/listings")
    }

    listing.status = "Rejected";
    await listing.save();
    req.flash("success", "Listing rejected successfully");
    res.redirect("/admin/listings");

  })

module.exports = router;