const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Listing = require("../models/listing");
const passport= require("passport");


router.get("/listings", async(req, res) => {
    const listings = await Listing.find({status: "Pending"}).populate("owner");
    if (!listings) {
        req.flash("error", "All listings are approved!");
    }
    else {
        res.render("admin/listings", {listings});
    }
})


router.post("/listings/:id/approve", async(req, res) => {
    const {id} = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "No listing found");
    }

    listing.status = "Approved";
    await listing.save();
    req.flash("success", "Listing approved successfully");
    res.redirect("/listings");
    
})

module.exports = router;