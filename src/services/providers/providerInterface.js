class OTPProvider {
  async send(identifier, otp) {
    throw new Error("send() must be implemented");
  }

  validateIdentifier(identifier) {
    throw new Error("validateIdentifier() must be implemented");
  }
}

module.exports = OTPProvider;
