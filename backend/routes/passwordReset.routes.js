const express = require('express');
const router = express.Router();
const controller = require('../controllers/passwordReset.controller');
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 requests per windowMs
    message: { msg: 'Too many OTP requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/request-otp', otpLimiter, controller.requestOtp);
router.post('/reset-password', controller.resetPassword);

module.exports = router;
