const { z } = require("zod");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

const sendOTPSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  identifierType: z.enum(["email", "phone"]).optional(),
});

const verifyOTPSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

function validateSendOTP(data) {
  const result = sendOTPSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message).join(", ");
    throw new Error(errors);
  }
  return result.data;
}

function validateVerifyOTP(data) {
  const result = verifyOTPSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message).join(", ");
    throw new Error(errors);
  }
  return result.data;
}

module.exports = {
  validateSendOTP,
  validateVerifyOTP,
  sendOTPSchema,
  verifyOTPSchema,
};
