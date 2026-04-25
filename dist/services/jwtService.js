"use strict";

const jwt = require("jsonwebtoken");
const {
  config
} = require("../config");
const logger = require("../utils/logger");
class JWTService {
  generateToken(payload) {
    try {
      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });
      return token;
    } catch (error) {
      logger.error("Failed to generate JWT:", error);
      throw new Error("Token generation failed");
    }
  }
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Token expired");
      }
      if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid token");
      }
      throw error;
    }
  }
  decodeToken(token) {
    return jwt.decode(token);
  }
}
module.exports = new JWTService();