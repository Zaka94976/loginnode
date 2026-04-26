const { config } = require("../config");
const { validateSendOTP, validateVerifyOTP } = require("../validations");
const redisService = require("../services/redisService");
const otpProviderFactory = require("../services/otpProviderFactory");
const jwtService = require("../services/jwtService");
const { generateOTP, generateRequestId } = require("../utils/otpGenerator");
const logger = require("../utils/logger");
const { AppError } = require("../middleware/errorHandler");

class AuthController {
  async sendOTP(req, res, next) {
    try {
      const requestId = generateRequestId();
      req.requestId = requestId;

      // Normalize 'phone' field to 'identifier' and infer type
      if (!req.body.identifier && req.body.phone) {
        req.body.identifier = req.body.phone;
        if (!req.body.identifierType) {
          req.body.identifierType = 'phone';
        }
      }

      const { identifier, identifierType } = validateSendOTP(req.body);

      const provider = otpProviderFactory.getProvider();
      if (!provider.validateIdentifier(identifier)) {
        throw new AppError(
          `Invalid ${identifierType || "identifier"} format`,
          400,
          "INVALID_IDENTIFIER",
        );
      }

      const cooldown = await redisService.getCooldown(identifier);
      if (cooldown > 0) {
        throw new AppError(
          `Please wait ${cooldown} seconds before requesting a new OTP`,
          429,
          "RATE_LIMITED",
        );
      }

      const otp = generateOTP(config.otp.digits);

      await Promise.all([
        redisService.storeOTP(identifier, otp, config.otp.expirySeconds),
        redisService.setCooldown(identifier, config.otp.resendCooldownSeconds),
      ]);

      await otpProviderFactory.sendOTP(identifier, otp);

      logger.info(`OTP sent to ${identifier}`, { requestId, identifierType });

      res.status(200).json({
        success: true,
        message: `OTP sent successfully to ${identifier}`,
        requestId,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyOTP(req, res, next) {
    try {
      const requestId = generateRequestId();
      req.requestId = requestId;

      // Normalize 'phone' field to 'identifier'
      if (!req.body.identifier && req.body.phone) {
        req.body.identifier = req.body.phone;
      }

      const { identifier, otp } = validateVerifyOTP(req.body);

      const storedOTP = await redisService.getOTP(identifier);
      if (!storedOTP) {
        throw new AppError("OTP expired or not found", 400, "OTP_EXPIRED");
      }

      const attempts = await redisService.getAttempts(identifier);
      if (attempts >= config.otp.maxAttempts) {
        await redisService.deleteOTP(identifier);
        await redisService.resetAttempts(identifier);
        throw new AppError("Too many attempts", 429, "MAX_ATTEMPTS_EXCEEDED");
      }

      if (otp !== storedOTP) {
        await redisService.incrementAttempts(identifier);
        const remainingAttempts = config.otp.maxAttempts - attempts;
        throw new AppError(
          `Invalid OTP. ${remainingAttempts} attempts remaining`,
          400,
          "INVALID_OTP",
        );
      }

      await Promise.all([
        redisService.deleteOTP(identifier),
        redisService.resetAttempts(identifier),
      ]);

      const user = {
        identifier,
        authenticatedAt: new Date().toISOString(),
      };

      const token = jwtService.generateToken(user);

      logger.info(`OTP verified for ${identifier}`, { requestId });

      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        data: {
          user: { identifier },
          token,
        },
        requestId,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
