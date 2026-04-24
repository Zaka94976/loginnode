const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);

router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

module.exports = router;
