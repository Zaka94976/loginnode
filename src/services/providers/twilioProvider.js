const OTPProvider = require("./providerInterface");
const { config } = require("../../config");
const logger = require("../../utils/logger");

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
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            To: phone,
            From: this.phoneNumber,
            Body: message,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        logger.error("Twilio API error:", data);
        throw new Error(data.message || "Failed to send SMS");
      }

      logger.info(`OTP sent via Twilio to ${phone}`, { sid: data.sid });
      return { success: true, messageId: data.sid };
    } catch (error) {
      logger.error("Twilio send error:", error);
      throw new Error("Failed to send SMS");
    }
  }
}

module.exports = new TwilioProvider();
