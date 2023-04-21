if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const router = express.Router({ mergeParams: true });
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);



router.get("/about-us", (req, res) => {
    res.render("business/aboutUs.ejs");
  })
  
  router.get("/contact-us", (req, res) => {
    res.render("business/contactUs");
  })

  router.post("/contact-us", async(req, res) => {
    const{name, email, message} = req.body;
    const msg = {
      to: process.env.EMAIL_FROM, // replace with your email address
      from: process.env.EMAIL_FROM,
      replyTo: email,
      subject: `New contact submission from ${name}`,
      html: `
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
    }

    await sgMail.send(msg);
    req.flash('success', 'Message sent successfully! We will be in contact with you soon');
    res.redirect('/contact-us');

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

  router.post("/submit-an-idea", async(req, res) => {
    const {name, ideatitle, ideaDescription, email} = req.body;  
    
    const msg = {
      to: process.env.EMAIL_FROM, // replace with your email address
      from: process.env.EMAIL_FROM,
      replyTo: email,
      subject: `New idea submission from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Idea Title:</strong> ${ideatitle}</p>
        <p><strong>Idea Description:</strong> ${ideaDescription}</p>
      `,
    };

    await sgMail.send(msg)
    // redirect to the same page with a success message
    req.flash('success', 'Your idea has been submitted successfully! We will review and get back to you');
    res.redirect('/submit-an-idea');
  })

  router.get("/faq", (req, res) => {
    res.render("business/FAQ.ejs")
  })


module.exports = router;