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
// const watchlistRoutes = require("./routes/watchlistRoutes");
const session = require("express-session");
const flash = require("connect-flash");
const ejsMate = require("ejs-mate");

const passport = require("passport");
const localStrategy = require("passport-local");

const User = require("./models/user");
const userRoutes =require("./routes/userRoutes");
const { db } = require("./models/user");
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

app.get("/listings/mylistings", isSignedIn, async(req, res) => {
  try {
    const currentUserId = req.user._id;
    const listings = await Listing.find({owner: currentUserId});
    res.render("listings/mylistings", {listings});

  } catch(error) {
    res.redirect("/");
  }

})

// Watchlist routes
app.get('/watchlist', async (req, res) => {
  try {
    const watchlist = await Watchlist.find({ owner: req.user._id }).populate('listing');
    res.render('listings/watchlist', { watchlist });
  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
});

app.post('/watchlist/add', async (req, res) => {
  if (!req.user) {
    // If the user is not authenticated, redirect to the login page
    return res.redirect('/login');
  }

  const userId = req.user._id;
  const listingId = req.body.listingId;

  // Check if the user already has the same listing in their watchlist
  const watchlist = await Watchlist.findOne({ owner: userId, listing: listingId });
  if (watchlist) {
    // If the user already has the same listing in their watchlist, display an appropriate message
    return res.send('You have already added this listing to your watchlist');
  }

  // If the user does not have the same listing in their watchlist, create a new watchlist item
  const newWatchlistItem = new Watchlist({
    owner: userId,
    listing: listingId,
  });

  // Save the new watchlist item to the database
  try {
    await newWatchlistItem.save();
    req.flash("success", "Listing added to your watchlist");
    res.redirect("/watchlist");
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

app.use("/listings", listingRoutes);
app.use("/listings/:id/bids", bidRoutes);
app.use("/", userRoutes);
// app.use("/watchlist", watchlistRoutes);

app.listen(3000, () => {
    console.log("Takamirira hedu paPort 3000");
})

