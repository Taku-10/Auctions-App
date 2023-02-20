const express = require("express");
const path = require("path");
// const catchAsync = require("./utilities/catchAsync");
// const AppError = require("./utilities/AppError");
// const Joi = require("joi")
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const Bid = require("./models/bid");
const Watchlist = require("./models/watchlist");
const methodOverride = require("method-override");
const listingRoutes = require("./routes/listingsRoutes");
const bidRoutes = require("./routes/bidsRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const adminRoutes = require("./routes/adminRoutes");

const session = require("express-session");
const flash = require("connect-flash");
const ejsMate = require("ejs-mate");

const passport = require("passport");
const localStrategy = require("passport-local");

const User = require("./models/user");
const userRoutes =require("./routes/userRoutes");

const{isSignedIn} = require("./authenticate");
const app = express();

mongoose.connect('mongodb://127.0.0.1:27017/Auctions', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("Mongo Connection open");
  })
  .catch((err) => {
    console.log("Mongo connection error");
    console.log(err);
  });

app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    }
  }))

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
})

app.get("/", (req, res) => {
  res.send("HOME");
})

/*This route will be used to retrieve all the listings that a user has posted*/
app.get("/listings/mylistings", isSignedIn, async(req, res) => {
  try {
    const currentUserId = req.user._id;
    // Find all the listings that have been posted by the currently logged in user
    const listings = await Listing.find({owner: currentUserId});
    res.render("listings/mylistings", {listings});

  } catch(error) {

    res.redirect("/");
  }

})

// Escape special characters in a string for use in a regular expression
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/*This route will be used to search for a listing by its title or description */
app.get("/listings/search", async (req, res) => {
  try {
    // Get the query string from the search form
    const query = req.query.q;
    
    if (!query) {
      return res.render("listings/search", {listings: [], query: ""})
    }
    // Create a regular expression object from the query string with the 'i' option for case insensitivity
    const regex = new RegExp(escapeRegex(query), "i");
    // Find all the listings where either the title or description matches the regular expression
    const listings = await Listing.find({
      $or: [
        { listingName: regex },
        { description: regex }
      ]
    });
    // Render the search results page with matchinglistings 
    res.render("listings/search", { listings, query });
  } catch (err) {
    console.error(err);
    res.redirect("/listings");
  }
});

app.use("/", userRoutes);
app.use("/listings", listingRoutes);
app.use("/watchlist", watchlistRoutes);
app.use("/listings/:id/bids", bidRoutes);
app.use("/admin", adminRoutes);

app.listen(3000, () => {
    console.log("Serving on port 3000");
});

