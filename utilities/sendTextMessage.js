const express = require("express");
require("dotenv").config();
const twilioClient = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


const sendTextMessage = async(toNumber, body) => {
  try {
    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      body,
      to: toNumber
    });
    console.log(`SMS notification sent to ${toNumber}: ${message.sid}`)

  } catch (error) {
    console.log(`Error sending SMS notification to ${toNumber}: ${error}`);
  }
}

module.exports = sendTextMessage;