require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { config, validateConfig } = require("./config");
const logger = require("./utils/logger");
const redisService = require("./services/redisService");
const authRoutes = require("./routes/auth");
const { errorHandler } = require("./middleware/errorHandler");
const { generateRequestId } = require("./utils/otpGenerator");

validateConfig();

const app = express();

// Trust Azure's proxy headers for correct client IP
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  req.requestId = generateRequestId();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  keyGenerator: (req) => {
    // Extract IP from proxy headers or connection, then remove any port number
    let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.ip ||
             req.connection?.remoteAddress ||
             '';

    // Strip brackets from IPv6 and remove trailing port (e.g., "[::1]:12345" -> "::1")
    ip = ip.replace(/^\[|\]$/g, '').replace(/:\d+$/, '');

    return ip || 'anonymous';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many requests" },
  },
});

app.use("/api", limiter);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({
    name: "OTP Auth API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "GET /health",
      sendOTP: "POST /api/auth/send-otp",
      verifyOTP: "POST /api/auth/verify-otp"
    }
  });
});

app.use("/api/auth", authRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await redisService.connect();
    logger.info("Redis connection established");
  } catch (error) {
    logger.warn("Failed to connect to Redis, running without OTP storage");
  }

  app.listen(config.server.port, () => {
    logger.info(`Server running on port ${config.server.port}`);
    logger.info(`Environment: ${config.server.nodeEnv}`);
    logger.info(`OTP Provider: ${config.otp.provider}`);
  });
}

startServer();

module.exports = app;
