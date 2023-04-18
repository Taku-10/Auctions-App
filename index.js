if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const Bid = require("./models/bid");
const Watchlist = require("./models/watchlist");
const methodOverride = require("method-override");
const listingRoutes = require("./routes/listingsRoutes");
const bidRoutes = require("./routes/bidsRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const adminRoutes = require("./routes/adminRoutes");
const businessRoutes = require("./routes/businessRoutes");
const moment = require("moment");
const session = require("express-session");
const flash = require("connect-flash");
const ejsMate = require("ejs-mate");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user");
const userRoutes =require("./routes/userRoutes");
const { isSignedIn} = require("./middleware/authenticate");
const checkAndEndAuctions = require("./cron/auctionCron");
const cron = require("node-cron");
const ExpressError = require("./utilities/ExpressError");
const mongoSanitize = require('express-mongo-sanitize');
const MongoStore = require('connect-mongo');

const app = express();
// process.env.DB_URL ||
const dbURL =  "mongodb://127.0.0.1:27017/Auctions";

mongoose.connect(dbURL, {
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
app.use(mongoSanitize())

const secret = process.env.SECRET || "mariebiscuitsarethebest"
const store = MongoStore.create({
  mongoUrl: dbURL,
  secret,
  touchAfter: 24 * 60 * 60
  
})

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e)
})

app.use(session({
  store,
  name: "session",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  }
}));


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
});


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
        { title: regex },
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
app.use("/", businessRoutes);


cron.schedule("* * * * *", async () => {
  await checkAndEndAuctions();
})


app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not found", 404));
})

app.use((err, req, res, next) => {
  const {statusCode=500} = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!"
  res.status(statusCode).render("error", {err});
});

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});

