const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP } = require('../utils/smsService');

// @route   POST /api/otp/send
// @desc    Send OTP to a phone number
router.post('/send', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone || phone.length < 10) {
            return res.status(400).json({ message: 'Please provide a valid phone number' });
        }

        const result = await sendOTP(phone);

        if (result.success) {
            res.json({
                message: 'OTP sent successfully!',
                demo: result.demo || false,
                // In demo mode, return OTP so the frontend can auto-fill it
                ...(result.demo ? { otp: result.otp } : {})
            });
        } else {
            res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/otp/verify
// @desc    Verify OTP for a phone number
router.post('/verify', (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: 'Phone and OTP are required' });
        }

        const result = verifyOTP(phone, otp);

        if (result.valid) {
            res.json({ verified: true, message: result.message });
        } else {
            res.status(400).json({ verified: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
