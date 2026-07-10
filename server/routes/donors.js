const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/auth');

const MALE_COOLDOWN_DAYS = 90;   // 3 months for male donors
const FEMALE_COOLDOWN_DAYS = 120; // 4 months for female donors

const getCooldownDays = (gender) =>
    (gender?.toLowerCase() === 'female') ? FEMALE_COOLDOWN_DAYS : MALE_COOLDOWN_DAYS;

// @route   GET /api/donors/search
// @desc    Search available donors by blood group and/or city
router.get('/search', async (req, res) => {
    try {
        const { bloodGroup, city } = req.query;

        const whereClause = {
            role: 'donor'
        };

        if (bloodGroup) whereClause.bloodGroup = bloodGroup;
        if (city) {
            whereClause.city = {
                contains: city
            };
        }

        const allDonors = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                role: true,
                bloodGroup: true,
                city: true,
                available: true,
                gender: true,
                lastDonationDate: true,
                points: true,
                isVerified: true,
                profilePicture: true,
                createdAt: true,
                updatedAt: true
                // NOTE: email and phone are intentionally NOT selected here
                // so they are never exposed to requesters viewing the donor list
            },
            orderBy: { createdAt: 'desc' }
        });

        // Apply gender-based cooldown filter and auto-update availability
        const now = new Date();
        const donorsToAutoUpdate = [];
        
        const donors = allDonors.filter(donor => {
            let isEligible = true;

            if (donor.lastDonationDate) {
                const cooldownDays = getCooldownDays(donor.gender);
                const daysSince = Math.floor((now - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24));
                isEligible = daysSince >= cooldownDays;
            }

            if (!isEligible) return false;

            // They are eligible. If they are marked unavailable, check if we should auto-update
            if (!donor.available && donor.lastDonationDate) {
                // If they have a lastDonationDate and cooldown has passed, they are automatically available again.
                donorsToAutoUpdate.push(donor.id);
                donor.available = true; // Update in-memory for this search result
            } else if (!donor.available && !donor.lastDonationDate) {
                // They manually toggled off and haven't donated recently, so keep them hidden.
                return false;
            }

            return donor.available;
        });

        // Fire-and-forget: update their status in the DB automatically
        if (donorsToAutoUpdate.length > 0) {
            prisma.user.updateMany({
                where: { id: { in: donorsToAutoUpdate } },
                data: { available: true }
            }).catch(e => console.error("Auto-update availability error:", e));
        }

        // map id to _id
        const mappedDonors = donors.map(d => ({ ...d, _id: d.id }));

        res.json(mappedDonors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/donors/profile
// @desc    Update donor profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { bloodGroup, city, lastDonationDate, phone, name, dob, gender, weight, district, profilePicture } = req.body;
        
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (bloodGroup) updateData.bloodGroup = bloodGroup;
        if (city) updateData.city = city;
        if (dob) updateData.dob = new Date(dob);
        if (gender !== undefined) updateData.gender = gender;
        if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
        if (district !== undefined) updateData.district = district;
        if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
        
        if (lastDonationDate) {
            updateData.lastDonationDate = new Date(lastDonationDate);
            // Auto-check eligibility using gender-based cooldown
            const donationDate = new Date(lastDonationDate);
            const daysSinceDonation = Math.floor((Date.now() - donationDate) / (1000 * 60 * 60 * 24));
            const cooldownDays = getCooldownDays(gender || user.gender);
            if (daysSinceDonation < cooldownDays) {
                updateData.available = false;
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: updateData
        });

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            bloodGroup: updatedUser.bloodGroup,
            city: updatedUser.city,
            available: updatedUser.available,
            lastDonationDate: updatedUser.lastDonationDate,
            dob: updatedUser.dob,
            gender: updatedUser.gender,
            weight: updatedUser.weight,
            district: updatedUser.district,
            profilePicture: updatedUser.profilePicture || ''
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/donors/availability
// @desc    Toggle donor availability
router.put('/availability', protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check gender-based cooldown before allowing re-enable
        if (!user.available && user.lastDonationDate) {
            const daysSinceDonation = Math.floor((Date.now() - new Date(user.lastDonationDate)) / (1000 * 60 * 60 * 24));
            const cooldownDays = getCooldownDays(user.gender);
            if (daysSinceDonation < cooldownDays) {
                const daysRemaining = cooldownDays - daysSinceDonation;
                const cooldownLabel = user.gender?.toLowerCase() === 'female'
                    ? '4 months (120 days) â€” Female'
                    : '3 months (90 days) â€” Male';
                return res.status(400).json({
                    message: `You cannot donate yet. Please wait ${daysRemaining} more day(s). Cooldown: ${cooldownLabel}`,
                    daysRemaining,
                    eligible: false
                });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { available: !user.available }
        });

        res.json({ available: updatedUser.available });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
