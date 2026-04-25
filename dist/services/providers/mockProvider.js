"use strict";

const OTPProvider = require("./providerInterface");
const logger = require("../../utils/logger");
class MockProvider extends OTPProvider {
  constructor() {
    super();
    this.sentOTPs = new Map();
  }
  validateIdentifier(identifier) {
    return identifier && identifier.length > 0;
  }
  async send(identifier, otp) {
    this.sentOTPs.set(identifier, otp);
    logger.info(`[MOCK] OTP sent to ${identifier}: ${otp}`);
    return {
      success: true,
      message: "OTP sent (mock mode)",
      mockOtp: otp
    };
  }
  getLastOTP(identifier) {
    return this.sentOTPs.get(identifier);
  }
  clearOTP(identifier) {
    this.sentOTPs.delete(identifier);
  }
}
module.exports = new MockProvider();