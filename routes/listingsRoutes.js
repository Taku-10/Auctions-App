const express = require("express");
const router = express.Router();

// post a listing
router.post("/", async (req, res) => {
  const listing = new Listing(req.body);
  await listing.save();
  res.send("Done");
});

// Show the detailed information about the listing
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
});

//Get the update a listing form
router.get("/:id/edit", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit", { listing });
});

// Update a listing
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, req.body);
  res.redirect(`/listings/${listing._id}`);
});

// Delete a listing
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndDelete(id);
  res.redirect("/listings");
});

module.exports = router;
