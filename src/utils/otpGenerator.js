const crypto = require("crypto");

function generateOTP(digits = 6) {
  const otp = crypto
    .randomInt(0, Math.pow(10, digits))
    .toString()
    .padStart(digits, "0");
  return otp;
}

function generateRequestId() {
  return crypto.randomUUID();
}

module.exports = { generateOTP, generateRequestId };
