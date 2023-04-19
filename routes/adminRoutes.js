const express = require("express");
const router = express.Router({ mergeParams: true });
const User = require("../models/user");
const Listing = require("../models/listing");
const passport = require("passport");
const Admin = require("../models/admin");
const { isSignedIn, isAdmin } = require("../middleware/authenticate");
const catchAsync = require("../utilities/catchAsync");
router.get("/all-users", isSignedIn, isAdmin, catchAsync(async(req, res) => {
  const users = await User.find({deleted: false});
  res.render("admin/AllUsers", {users});
}));


router.get('/users/:id', catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id, { deleted: false });
  res.render('admin/usersShow', { user });
 
}));

// Edit user form route
router.get('/users/:id/edit', isSignedIn, isAdmin, catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id, {deleted: false});
  if (!user) {
    req.flash("error", "User not found");
    res.redirect("/listings");
  }
  res.render('admin/editUser', { user })
}))

router.put("/:id", isSignedIn, isAdmin, catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, req.body, {deleted: false} , { runValidators: true, new: true });
  await user.save();
  req.flash("success", "Successfully updated the user's details");
  res.redirect(`/admin/users/${user._id}`);
}))


router.delete("/:id", isSignedIn, isAdmin, catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    req.flash("error", "User not found");
    return res.redirect("/admin/all-users");
  }
  user.deleted = true;
  await user.save();
  req.flash("success", "Successfully deleted the user");
  res.redirect("/admin/all-users");
}));






/*Retrieve all the listings from the database that have been posted by users. They all have
a default ststus of pending which will need to be approved or rejected by an admin*/
router.get("/listings", catchAsync(async (req, res) => {
  // Find and retrieve all listings from the database with a status of Pending
  const listings = await Listing.find({ status: "Pending" }).populate("owner");
  if (!listings) {
    // Flash an error message if no listings are found, that is there are no listings that are pending approval
    req.flash("error", "All listings are approved!");
  } else {
    // render the listings with pending ststus and pass them as an object to the ejs template
    res.render("admin/listings", { listings });
  }
}));

/*This route displayes more information about a specific listing*/
router.get("/listings/:id", catchAsync(async (req, res) => {
  const { id } = req.params;
  // Find the particular listing from the database with that id in the req params
  const listing = await Listing.findById(id).populate("owner").populate("bids");
  res.render("admin/show", { listing });
}));

/*Thir route will be the one used to find a particular listing by it's id from the database and
  approve it ie change it's status to Approved*/
router.post("/listings/:id/approve", catchAsync(async (req, res) => {
  const { id } = req.params;
  // Find the particular listing by it's id in the database
  const listing = await Listing.findById(id);
  if (!listing) {
    // The listing is not in the database
    req.flash("error", "No listing found");
    res.redirect("/admin/listings");
  }
  // If the listing is found, then change it's status to approved  and save it to the database again
  listing.status = "Approved";
  // Whoever the currently logged in admin is
  listing.handledBy = req.user._id;
  await listing.save();
  req.flash("success", "Listing approved successfully");
  res.redirect("/admin/listings");
}));

/*This route will be the one used to find a particular listing by it's id from the database and
  delete it ie change it's status to Rejected*/
router.post("/listings/:id/reject", catchAsync(async (req, res) => {
  const { id } = req.params;
  // Find the particular listing from the database by its id
  const listing = await Listing.findById(id);
  if (!listing) {
    // Listing not in the database
    req.flash("error", "No listing found");
    res.redirect("/admin/listings");
  }
  // Listing found in the databas by it's id then change it's status to Rejected and save it back in the database
  listing.status = "Rejected";
  await listing.save();
  req.flash("success", "Listing rejected");
  res.redirect("/admin/listings");
}));

module.exports = router;
