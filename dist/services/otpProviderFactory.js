"use strict";

const {
  config
} = require("../config");
const logger = require("../utils/logger");
const providers = {
  email: require("./providers/emailProvider"),
  mock: require("./providers/mockProvider"),
  twilio: require("./providers/twilioProvider")
};
class OTPProviderFactory {
  constructor() {
    this.currentProvider = null;
    this.providerName = null;
  }
  getProvider() {
    if (this.currentProvider) {
      return this.currentProvider;
    }
    const providerName = config.otp.provider;
    this.providerName = providerName;
    if (!providers[providerName]) {
      logger.warn(`Provider "${providerName}" not found, falling back to mock`);
      this.currentProvider = providers.mock;
    } else {
      this.currentProvider = providers[providerName];
    }
    logger.info(`OTP Provider initialized: ${this.providerName}`);
    return this.currentProvider;
  }
  getProviderName() {
    return this.providerName;
  }
  async sendOTP(identifier, otp) {
    const provider = this.getProvider();
    if (!provider.validateIdentifier(identifier)) {
      throw new Error(`Invalid identifier for ${this.providerName} provider`);
    }
    return await provider.send(identifier, otp);
  }
}
module.exports = new OTPProviderFactory();