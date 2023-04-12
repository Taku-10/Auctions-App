const express = require("express");
const ExpressError = require("../utilities/ExpressError");
const {listingSchema} = require("../schemas.js")
const Joi = require("joi");

const validateListing = (req, res, next) => {
  const {error} = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(',')
    throw new ExpressError(msg, 400)
  } else {
    next();
  }
  
}

module.exports = validateListing;