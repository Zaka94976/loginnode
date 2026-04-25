"use strict";

const OTPProvider = require("./providerInterface");
const {
  config
} = require("../../config");
const logger = require("../../utils/logger");
const axios = require("axios");
class TwilioProvider extends OTPProvider {
  constructor() {
    super();
    this.accountSid = config.sms.accountSid;
    this.authToken = config.sms.authToken;
    this.phoneNumber = config.sms.phoneNumber;
    this.enabled = true;
  }
  validateIdentifier(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }
  async send(phone, otp) {
    if (!this.validateIdentifier(phone)) {
      throw new Error("Invalid phone number format");
    }
    if (!this.accountSid || !this.authToken || !this.phoneNumber) {
      throw new Error("Twilio configuration missing");
    }
    const message = `Your OTP code is: ${otp}. Valid for ${config.otp.expirySeconds / 60} minutes.`;
    try {
      const response = await axios.post(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, new URLSearchParams({
        To: phone,
        From: this.phoneNumber,
        Body: message
      }).toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`
        }
      });
      const data = response.data;
      if (response.status !== 201) {
        logger.error("Twilio API error:", data);
        throw new Error(data.message || "Failed to send SMS");
      }
      logger.info(`OTP sent via Twilio to ${phone}`, {
        sid: data.sid
      });
      return {
        success: true,
        messageId: data.sid
      };
    } catch (error) {
      logger.error("Twilio send error:", error);
      throw new Error("Failed to send SMS");
    }
  }
}
module.exports = new TwilioProvider();