const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
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
        type: Number,
        required: [true, "Phone number must be supplied"]
    }
})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);