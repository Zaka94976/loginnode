"use strict";

const jwtService = require("../services/jwtService");
const {
  AppError
} = require("./errorHandler");
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401, "NO_TOKEN");
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwtService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.statusCode === 401) {
      return next(error);
    }
    next(new AppError("Invalid token", 401, "INVALID_TOKEN"));
  }
}
module.exports = authMiddleware;