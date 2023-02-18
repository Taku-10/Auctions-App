const express = require("express");
const router = express.Router();
const User = require("../models/user");
const passport= require("passport");
const{isSignedIn} = require("../authenticate");

/*This route will be used to render the register form for a user to register*/
router.get("/register", (req, res) => {
    res.render("users/register.ejs")
})


/*This route will be used to register a user thus submitting the user's details to the database*/
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


/*This route will be used to render the log in form for the user to log in*/
router.get("/login", (req, res) => {
    res.render("users/login");

});


/*This route will be used to log in the user by checking the provided details on the log in form correspond to the
 ones in the database*/
router.post("/login", passport.authenticate("local", {failureFlash: true, failureRedirect:"/login"}), (req, res) => {
    req.flash("success", "Welcome back");
    const redirectUrl = req.session.returnTo || "/listings";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
});


/*This route will be used to log out the user*/
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if(err) return next(err);
        req.flash("success", "Goodbye!");
        res.redirect("/listings");
    });
    
});

module.exports = router;
