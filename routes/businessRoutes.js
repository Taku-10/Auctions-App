const express = require("express");
const router = express.Router({ mergeParams: true });



router.get("/about-us", (req, res) => {
    res.render("business/aboutUs.ejs");
  })
  
  router.get("/contact-us", (req, res) => {
    res.render("business/contactUs");
  })
  
  router.get("/help-center", (req, res) => {
    res.render("business/helpCenter.ejs");
  })
  
  router.get("/privacy-policy", (req, res) => {
    res.render("business/privacyPolicy.ejs");
  })
  
  router.get("/termsAndConditions", (req, res) => {
    res.render("business/t&c's.ejs");
  })

  router.get("/submit-an-idea", (req, res) => {
    res.render("business/submitAnIdea.ejs")
  })

  router.get("/faq", (req, res) => {
    res.render("business/FAQ.ejs")
  })


module.exports = router;