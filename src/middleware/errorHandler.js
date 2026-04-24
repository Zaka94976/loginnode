const logger = require("../utils/logger");

class AppError extends Error {
  constructor(message, statusCode, code = "ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function errorHandler(err, req, res, next) {
  const requestId = req.requestId || "unknown";

  if (err.name === "ZodError") {
    const errors = err.errors.map((e) => e.message).join(", ");
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: errors },
      requestId,
    });
  }

  if (err.isOperational) {
    logger.warn(`Operational error: ${err.message}`, { requestId });
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
      requestId,
    });
  }

  logger.error(`Unhandled error: ${err.message}`, {
    requestId,
    stack: err.stack,
  });

  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message },
    requestId,
  });
}

module.exports = { AppError, errorHandler };
