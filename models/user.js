const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const crypto = require('crypto');
const {Schema} = mongoose;

const userSchema = new Schema({
    firstname: {
        type: String, 
        required: [true, "firstname must be supplied"]
    },
    lastname: {
        type: String, 
        required: [true, "lastname must be supplied"]
    },

    username: {
        type: String, 
        required: [true, "username must be supplied"]
    },

    email: {
        type: String,
        required: [true, "Email address must be supplied"],
        unique: true
    },

    number: {
        type: String,
        required: [true, "Phone number must be supplied"]
    },

    role: {
        type: String,
        default: "user"
    },

    resetPasswordToken: String,
    
    resetPasswordExpires: Date

})

userSchema.plugin(passportLocalMongoose);

userSchema.methods.generateResetToken = function() {
    this.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordExpires = Date.now() + 3600000; // Expires in 1 hour
  };

module.exports = mongoose.model("User", userSchema);