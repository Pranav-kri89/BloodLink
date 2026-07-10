const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { protect } = require('../middleware/auth');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, role, bloodGroup, city, dob, gender, weight, district, lastDonationDate, available, profilePicture } = req.body;

        // Check if user exists
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                role: role || 'donor',
                bloodGroup: bloodGroup || '',
                city: city || '',
                dob: dob ? new Date(dob) : null,
                gender: gender || '',
                weight: weight ? parseFloat(weight) : null,
                district: district || '',
                lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : null,
                available: available !== undefined ? Boolean(available) : true,
                profilePicture: profilePicture || ''
            }
        });

        res.status(201).json({
            _id: user.id, // mapped to _id for frontend compatibility
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            bloodGroup: user.bloodGroup,
            city: user.city,
            available: user.available,
            dob: user.dob,
            gender: user.gender,
            weight: user.weight,
            district: user.district,
            lastDonationDate: user.lastDonationDate,
            profilePicture: user.profilePicture || '',
            token: generateToken(user.id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login user & return JWT
//          Admins: email + password ONLY
//          Donors/Requesters: email OR phone + password
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Please provide login credentials and password.' });
        }

        const isPhone = /^\d{7,15}$/.test(identifier.trim());

        let user = null;

        if (isPhone) {
            // Phone-based login: search by phone number
            const usersWithPhone = await prisma.user.findMany({
                where: { phone: identifier.trim() }
            });

            if (usersWithPhone.length === 0) {
                return res.status(401).json({ message: 'No account found with this phone number.' });
            }

            // Admins cannot log in via phone
            const nonAdminUsers = usersWithPhone.filter(u => u.role !== 'admin');
            if (nonAdminUsers.length === 0) {
                return res.status(403).json({ message: 'Admin accounts must use email to log in.' });
            }

            // If multiple non-admin users share this phone (edge case), pick first valid password match
            for (const candidate of nonAdminUsers) {
                const match = await bcrypt.compare(password, candidate.password);
                if (match) { user = candidate; break; }
            }

            if (!user) {
                return res.status(401).json({ message: 'Invalid phone number or password.' });
            }
        } else {
            // Email-based login
            user = await prisma.user.findUnique({ where: { email: identifier.trim() } });

            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            bloodGroup: user.bloodGroup,
            city: user.city,
            available: user.available,
            lastDonationDate: user.lastDonationDate,
            profilePicture: user.profilePicture || '',
            token: generateToken(user.id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const { requireAuth, getAuth } = require('@clerk/express');

// @route   POST /api/auth/sync
// @desc    Sync a Clerk user to our database
router.post('/sync', async (req, res) => {
    try {
        const { userId } = getAuth(req);
        const clerkId = userId;
        if (!clerkId) {
            return res.status(401).json({ message: 'Unauthorized: No clerkId found in req.auth' });
        }
        const { email, name, profilePicture, role, bloodGroup, city, phone } = req.body;

        let user = await prisma.user.findUnique({
            where: { clerkId }
        });

        if (!user) {
            // Check if user exists by email (legacy user migrating to Clerk)
            if (email) {
                user = await prisma.user.findUnique({ where: { email } });
            }
            
            if (user) {
                // Link the legacy user
                user = await prisma.user.update({
                    where: { email },
                    data: {
                        clerkId,
                        // Only set Clerk's picture if the user has no custom picture saved yet
                        ...(!user.profilePicture && profilePicture ? { profilePicture } : {})
                    }
                });
            } else {
                // Create a completely new user
                const placeholderEmail = email || `user_${clerkId}@bloodlink.local`;
                user = await prisma.user.create({
                    data: {
                        clerkId,
                        email: placeholderEmail,
                        name: name || 'User',
                        role: role || 'donor',
                        bloodGroup: bloodGroup || '',
                        city: city || '',
                        address: req.body.address || '',
                        phone: phone || '',
                        dob: req.body.dob ? new Date(req.body.dob) : null,
                        profilePicture: profilePicture || ''
                    }
                });
            }
        } else {
            // Update if they're passing onboarding fields
            // NOTE: profilePicture is intentionally excluded here â€” it should only be
            // updated through the dedicated /api/donors/profile route to prevent
            // the Clerk avatar from overwriting the user's custom uploaded picture.
            if (role || bloodGroup || city || phone || req.body.address || req.body.dob) {
                user = await prisma.user.update({
                    where: { clerkId },
                    data: {
                        ...(role && { role }),
                        ...(bloodGroup && { bloodGroup }),
                        ...(city && { city }),
                        ...(req.body.address && { address: req.body.address }),
                        ...(phone && { phone }),
                        ...(req.body.dob && { dob: new Date(req.body.dob) })
                    }
                });
            }
        }

        // Enforce onboarding: check if required fields are missing
        if (!user.city || !user.bloodGroup || !user.phone || !user.address || !user.dob) {
            return res.status(400).json({ code: 'NEEDS_ONBOARDING', message: 'Please complete your profile' });
        }

        const { password, ...userWithoutPassword } = user;
        res.json({
            ...userWithoutPassword,
            _id: user.id
        });

    } catch (error) {
        console.error("Sync error:", error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', protect, async (req, res) => {
    try {
        let user = req.user;
        
        // Auto-update availability if cooldown has passed and they are currently unavailable
        if (!user.available && user.lastDonationDate && user.role === 'donor') {
            const getCooldownDays = (gender) =>
                (gender?.toLowerCase() === 'female') ? 120 : 90;
            const cooldownDays = getCooldownDays(user.gender);
            const daysSince = Math.floor((new Date() - new Date(user.lastDonationDate)) / (1000 * 60 * 60 * 24));
            
            if (daysSince >= cooldownDays) {
                user.available = true;
                // Update in DB asynchronously
                prisma.user.update({
                    where: { id: user.id || user._id },
                    data: { available: true }
                }).catch(e => console.error("Auto-update /me availability error:", e));
            }
        }

        // req.user is populated by protect middleware
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
