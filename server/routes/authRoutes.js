const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { requestOTP, verifyOTP, getMe, logout } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

router.post('/send-otp', authLimiter, requestOTP);
router.post('/verify-otp', authLimiter, verifyOTP);
router.get('/me', authMiddleware, getMe);
router.post('/logout', logout);

module.exports = router;
