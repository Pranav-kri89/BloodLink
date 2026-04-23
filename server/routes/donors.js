const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const DONATION_COOLDOWN_DAYS = 60;

// @route   GET /api/donors/search
// @desc    Search available donors by blood group and/or city
router.get('/search', async (req, res) => {
    try {
        const { bloodGroup, city } = req.query;
        const query = { role: 'donor', available: true };

        if (bloodGroup) query.bloodGroup = bloodGroup;
        if (city) query.city = new RegExp(city, 'i');

        // Only return donors who are eligible (last donation >= 60 days ago or never donated)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DONATION_COOLDOWN_DAYS);
        query.$or = [
            { lastDonationDate: { $exists: false } },
            { lastDonationDate: null },
            { lastDonationDate: { $lte: cutoffDate } }
        ];

        const donors = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(donors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/donors/profile
// @desc    Update donor profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { bloodGroup, city, lastDonationDate, phone, name } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (bloodGroup) user.bloodGroup = bloodGroup;
        if (city) user.city = city;
        if (lastDonationDate) {
            user.lastDonationDate = lastDonationDate;
            // Auto-check eligibility: if donated within 60 days, set unavailable
            const donationDate = new Date(lastDonationDate);
            const daysSinceDonation = Math.floor((Date.now() - donationDate) / (1000 * 60 * 60 * 24));
            if (daysSinceDonation < DONATION_COOLDOWN_DAYS) {
                user.available = false;
            }
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            bloodGroup: updatedUser.bloodGroup,
            city: updatedUser.city,
            available: updatedUser.available,
            lastDonationDate: updatedUser.lastDonationDate
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/donors/availability
// @desc    Toggle donor availability
router.put('/availability', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check 60-day cooldown before allowing toggle to available
        if (!user.available && user.lastDonationDate) {
            const daysSinceDonation = Math.floor((Date.now() - new Date(user.lastDonationDate)) / (1000 * 60 * 60 * 24));
            if (daysSinceDonation < DONATION_COOLDOWN_DAYS) {
                const daysRemaining = DONATION_COOLDOWN_DAYS - daysSinceDonation;
                return res.status(400).json({
                    message: `You cannot donate yet. Please wait ${daysRemaining} more day(s). (60-day cooldown after last donation)`,
                    daysRemaining,
                    eligible: false
                });
            }
        }

        user.available = !user.available;
        await user.save();

        res.json({ available: user.available });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
