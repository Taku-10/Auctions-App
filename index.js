const express = require("express");
const path = require("path");
// const catchAsync = require("./utilities/catchAsync");
// const AppError = require("./utilities/AppError");
// const Joi = require("joi")
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const Bid = require("./models/bid");
const methodOverride = require("method-override");
const listingRoutes = require("./routes/listingsRoutes");
const bidRoutes = require("./routes/bidsRoutes");
const session = require("express-session");
const flash = require("connect-flash");
const ejsMate = require("ejs-mate");

const passport = require("passport");
const localStrategy = require("passport-local");

const User = require("./models/user");
const userRoutes =require("./routes/userRoutes");
const { db } = require("./models/user");
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

app.use("/listings", listingRoutes);
app.use("/listings/:id/bids", bidRoutes);
app.use("/", userRoutes);

app.listen(3000, () => {
    console.log("Takamirira hedu paPort 3000");
})

