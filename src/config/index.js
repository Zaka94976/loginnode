require("dotenv").config();

const config = {
  server: {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  otp: {
    digits: parseInt(process.env.OTP_DIGITS || "6", 10),
    expirySeconds: parseInt(process.env.OTP_EXPIRY_SECONDS || "300", 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || "5", 10),
    resendCooldownSeconds: parseInt(
      process.env.OTP_RESEND_COOLDOWN_SECONDS || "60",
      10,
    ),
    provider: process.env.OTP_PROVIDER || "email",
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10", 10),
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  sms: {
    provider: process.env.SMS_PROVIDER || "twilio",
    accountSid: process.env.SMS_ACCOUNT_SID,
    authToken: process.env.SMS_AUTH_TOKEN,
    phoneNumber: process.env.SMS_PHONE_NUMBER,
  },
  log: {
    level: process.env.LOG_LEVEL || "info",
  },
};

function validateConfig() {
  const errors = [];

  if (!config.jwt.secret || config.jwt.secret === "default-secret-change-me") {
    errors.push("JWT_SECRET must be set in production");
  }

  if (
    config.otp.provider === "email" &&
    (!config.smtp.host || !config.smtp.user || !config.smtp.pass)
  ) {
    errors.push("SMTP configuration is required when OTP_PROVIDER=email");
  }

  if (errors.length > 0) {
    console.error("Configuration validation errors:", errors);
    if (config.server.nodeEnv === "production") {
      throw new Error(`Config validation failed: ${errors.join(", ")}`);
    }
    console.warn("Running in development mode - some validations skipped");
  }

  return config;
}

module.exports = { config, validateConfig };
