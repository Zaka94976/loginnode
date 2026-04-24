const nodemailer = require("nodemailer");
const OTPProvider = require("./providerInterface");
const { config } = require("../../config");
const logger = require("../../utils/logger");

class EmailProvider extends OTPProvider {
  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  validateIdentifier(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async send(email, otp) {
    if (!this.validateIdentifier(email)) {
      throw new Error("Invalid email format");
    }

    const mailOptions = {
      from: `"OTP Service" <${config.smtp.user}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}. This code will expire in ${config.otp.expirySeconds / 60} minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>OTP Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #4A90E2; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in ${config.otp.expirySeconds / 60} minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`OTP sent to email: ${email}`, { messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error("Failed to send OTP email:", error);
      throw new Error("Failed to send OTP");
    }
  }
}

module.exports = new EmailProvider();
