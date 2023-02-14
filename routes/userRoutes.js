const express = require("express");
const router = express.Router();
const User = require("../models/user");
const passport= require("passport");
const{isSignedIn} = require("../authenticate");
router.get("/register", (req, res) => {
    res.render("users/register.ejs")
})

router.post("/register", async(req, res, next) => {
    try {
        const {firstname, lastname, email, username, number, password} = req.body;
        const user = new User({firstname, lastname, email, username, number});
        const registeredUser = await User.register(user, password);
        req.logIn(registeredUser, err => {
            if (err) return next(err);
            req.flash("success", "Welcome")
            res.redirect("/listings");
        });
        
    } catch (e) 
    {
        req.flash("error", e.message);
        res.redirect("/register");
    }
    
})

router.get("/login", (req, res) => {
    res.render("users/login");

})

router.post("/login", passport.authenticate("local", {failureFlash: true, failureRedirect:"/login"}), (req, res) => {
    req.flash("success", "Welcome back");
    const redirectUrl = req.session.returnTo || "/listings";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if(err) return next(err);
        req.flash("success", "Goodbye!");
        res.redirect("/listings");
    });
    
})

module.exports = router;
