"use strict";

const twilio = require('twilio');
const OTPProvider = require("./providerInterface");
const {
  config
} = require("../../config");
const logger = require("../../utils/logger");
class TwilioProvider extends OTPProvider {
  constructor() {
    super();
    this.accountSid = config.sms.accountSid;
    this.authToken = config.sms.authToken;
    this.phoneNumber = config.sms.phoneNumber;
    this.enabled = true;
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    } else {
      this.client = null;
    }
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
      throw new Error("Twilio configuration missing - check SMS_ACCOUNT_SID, SMS_AUTH_TOKEN, and SMS_PHONE_NUMBER");
    }
    if (!this.client) {
      throw new Error("Twilio client not initialized");
    }
    const message = `Your OTP code is: ${otp}. Valid for ${config.otp.expirySeconds / 60} minutes.`;
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: phone
      });
      logger.info(`OTP sent via Twilio to ${phone}`, {
        sid: result.sid,
        status: result.status
      });
      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        to: result.to,
        from: result.from
      };
    } catch (error) {
      logger.error("Twilio send error:", {
        message: error.message,
        code: error.code,
        status: error.status,
        phone: phone
      });
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
}
module.exports = new TwilioProvider();