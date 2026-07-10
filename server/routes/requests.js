const express = require('express');
const router = express.Router();
const { prisma } = require('../config/db');
const { protect } = require('../middleware/auth');
const { sendDonorNotification } = require('../utils/sendEmail');
const { sendSMSNotification } = require('../utils/smsService');

const DONATION_COOLDOWN_DAYS = 60;

// @route   POST /api/requests
// @desc    Create a blood request and notify matching donors via email
router.post('/', protect, async (req, res) => {
    try {
        const { patientName, bloodGroup, city, hospital, contactNumber, unitsNeeded, urgency } = req.body;

        const request = await prisma.bloodRequest.create({
            data: {
                requesterId: req.user.id,
                patientName,
                bloodGroup,
                city,
                hospital,
                contactNumber,
                unitsNeeded: unitsNeeded || 1,
                urgency: urgency || 'normal'
            }
        });

        // Find matching available donors (same blood group + same city + eligible)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DONATION_COOLDOWN_DAYS);

        const matchingDonors = await prisma.user.findMany({
            where: {
                role: 'donor',
                available: true,
                bloodGroup: bloodGroup,
                city: {
                    equals: city,
                    mode: 'insensitive' // case-insensitive match
                },
                OR: [
                    { lastDonationDate: null },
                    { lastDonationDate: { lte: cutoffDate } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true
            }
        });

        // Create in-app notifications for matching donors
        const urgencyLabel = (urgency || 'normal').charAt(0).toUpperCase() + (urgency || 'normal').slice(1);
        
        const notificationsData = matchingDonors.map(donor => ({
            recipientId: donor.id,
            type: 'blood_request',
            bloodRequestId: request.id,
            title: `${urgencyLabel} Blood Request - ${bloodGroup} needed`,
            message: `${patientName} needs ${unitsNeeded || 1} unit(s) of ${bloodGroup} blood at ${hospital}, ${city}.`,

            patientName,
            bloodGroup,
            city,
            hospital,
            urgency: urgency || 'normal',
            unitsNeeded: unitsNeeded || 1,
            contactNumber
        }));

        if (notificationsData.length > 0) {
            await prisma.notification.createMany({
                data: notificationsData
            });
        }

        // Send email notifications (if configured)
        let notifiedCount = 0;
        if (matchingDonors.length > 0 && process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_gmail@gmail.com') {
            const requestDetails = {
                patientName, bloodGroup, city, hospital, contactNumber,
                unitsNeeded: unitsNeeded || 1, urgency: urgency || 'normal',

            };
            const emailPromises = matchingDonors.map(donor =>
                sendDonorNotification(donor.email, donor.name, requestDetails)
            );
            const results = await Promise.allSettled(emailPromises);
            notifiedCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
        }

        // Send SMS notifications to matching donors with phone numbers
        let smsCount = 0;
        const donorsWithPhone = matchingDonors.filter(d => d.phone);
        if (donorsWithPhone.length > 0) {
            const smsDetails = {
                patientName, bloodGroup, city, hospital,
                urgency: urgency || 'normal', contactNumber
            };
            const smsPromises = donorsWithPhone.map(donor =>
                sendSMSNotification(donor.phone, donor.name, smsDetails)
            );
            const smsResults = await Promise.allSettled(smsPromises);
            smsCount = smsResults.filter(r => r.status === 'fulfilled' && r.value === true).length;
        }

        console.log(`Blood request created.${matchingDonors.length} donors matched, ${notifiedCount} emailed, ${smsCount} SMS sent.`);

        res.status(201).json({
            ...request,
            _id: request.id,
            matchingDonors: matchingDonors.length,
            notifiedDonors: notifiedCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/requests/my
// @desc    Get current user's requests
router.get('/my', protect, async (req, res) => {
    try {
        const requests = await prisma.bloodRequest.findMany({
            where: { requesterId: req.user.id },
            include: {
                donor: {
                    select: { name: true, phone: true, id: true, profilePicture: true, bloodGroup: true, city: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        // Map id to _id
        const mappedRequests = requests.map(r => ({
            ...r,
            _id: r.id,
            donor: r.donor ? { ...r.donor, _id: r.donor.id } : null
        }));
        
        res.json(mappedRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/requests/:id
// @desc    Get a single blood request by ID (for donor journey + tracking pages)
router.get('/:id', protect, async (req, res) => {
    try {
        const request = await prisma.bloodRequest.findUnique({
            where: { id: req.params.id },
            include: {
                donor: {
                    select: { id: true, name: true, phone: true, profilePicture: true, bloodGroup: true, city: true }
                },
                requester: {
                    select: { id: true, name: true, phone: true }
                },
                liveLocation: true
            }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json({ ...request, _id: request.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc    Update request status
//          Requester: fulfilled, cancelled | Donor: arrived
router.put('/:id/status', protect, async (req, res) => {
    try {
        const request = await prisma.bloodRequest.findUnique({
            where: { id: req.params.id }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const newStatus = req.body.status;
        const isRequester = request.requesterId === req.user.id;
        const isDonor = request.donorId === req.user.id;

        // Authorization check
        if (!isRequester && !isDonor) {
            return res.status(401).json({ message: 'Not authorized to update this request' });
        }
        // Donor can only set 'arrived'
        if (isDonor && !isRequester && newStatus !== 'arrived') {
            return res.status(401).json({ message: 'Donor can only mark request as arrived' });
        }

        // If being fulfilled — award donor + notify requester
        if (newStatus === 'fulfilled' && request.status !== 'fulfilled') {
            if (request.donorId) {
                const donor = await prisma.user.findUnique({ where: { id: request.donorId } });
                if (donor) {
                    await prisma.user.update({
                        where: { id: donor.id },
                        data: {
                            lastDonationDate: new Date(),
                            available: false,
                            points: { increment: 50 }
                        }
                    });

                    // Notify donor: reward earned
                    await prisma.notification.create({
                        data: {
                            recipientId: donor.id,
                            type: 'request_fulfilled',
                            title: '🎉 You earned 50 Points!',
                            message: `Thank you for donating blood to ${request.patientName}. You have been awarded 50 points and your donor level is growing!`,
                            bloodRequestId: request.id,
                            patientName: request.patientName,
                            hospital: request.hospital,
                            city: request.city,
                            urgency: request.urgency,
                            unitsNeeded: request.unitsNeeded,
                            contactNumber: request.contactNumber,
                        }
                    });
                }
            }

            // GAP 4 FIX: Notify the requester that donation is complete
            await prisma.notification.create({
                data: {
                    recipientId: request.requesterId,
                    type: 'general',
                    title: '✅ Donation Completed!',
                    message: `Your blood request for ${request.patientName} has been fulfilled. A certificate has been issued to the donor. Thank you for using BloodLink!`,
                    bloodRequestId: request.id,
                    patientName: request.patientName,
                    hospital: request.hospital,
                    city: request.city,
                    urgency: request.urgency,
                    unitsNeeded: request.unitsNeeded,
                    contactNumber: request.contactNumber,
                }
            });
        }

        const updatedRequest = await prisma.bloodRequest.update({
            where: { id: request.id },
            data: { status: newStatus }
        });

        // Emit socket so tracking page updates instantly
        try {
            const { getIo } = require('../socket');
            const io = getIo();
            io.to(`track_${request.id}`).emit(`request_update_${request.id}`, { status: newStatus });
        } catch (e) { /* non-critical */ }
        
        res.json({ ...updatedRequest, _id: updatedRequest.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/requests/:id/accept
// @desc    Accept a blood request (for donor)
router.put('/:id/accept', protect, async (req, res) => {
    try {
        const request = await prisma.bloodRequest.findUnique({
            where: { id: req.params.id }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request is no longer pending' });
        }

        // Link donor and change status
        const updatedRequest = await prisma.bloodRequest.update({
            where: { id: request.id },
            data: {
                donorId: req.user.id,
                status: 'accepted'
            }
        });

        // Notify the requester that a donor accepted
        await prisma.notification.create({
            data: {
                recipientId: request.requesterId,
                type: 'general',
                title: '🎉 Donor Accepted Your Request!',
                message: `${req.user.name} has accepted your blood request for ${request.patientName}. They will start their journey to ${request.hospital} shortly. You can track them live.`,
                bloodRequestId: request.id,
                patientName: request.patientName,
                hospital: request.hospital,
                city: request.city,
                urgency: request.urgency,
                unitsNeeded: request.unitsNeeded,
                contactNumber: request.contactNumber,
            }
        });

        // Emit socket so requester's tracking page updates in real time
        try {
            const { getIo } = require('../socket');
            const io = getIo();
            io.to(`track_${request.id}`).emit('request_accepted', {
                requestId: request.id,
                status: 'accepted',
                donorId: req.user.id,
                donorName: req.user.name
            });
        } catch (e) {
            console.warn('Socket emit failed (non-critical):', e.message);
        }

        res.json({ ...updatedRequest, _id: updatedRequest.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/requests/donor/my
// @desc    Get donor's accepted/fulfilled requests
router.get('/donor/my', protect, async (req, res) => {
    try {
        const requests = await prisma.bloodRequest.findMany({
            where: { donorId: req.user.id },
            include: {
                requester: {
                    select: { name: true, phone: true, id: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        const mappedRequests = requests.map(r => ({
            ...r,
            _id: r.id,
            requester: r.requester ? { ...r.requester, _id: r.requester.id } : null
        }));
        
        res.json(mappedRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/requests/:id/journey
// @desc    Start donor live journey — creates LiveLocation record and notifies requester
router.post('/:id/journey', protect, async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const requestId = req.params.id;

        const request = await prisma.bloodRequest.findUnique({
            where: { id: requestId }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.donorId !== req.user.id) {
            return res.status(401).json({ message: 'Only the assigned donor can start the journey' });
        }

        // Upsert LiveLocation (create if not exists, update if already exists)
        const liveLocation = await prisma.liveLocation.upsert({
            where: { requestId },
            update: { latitude, longitude, updatedAt: new Date() },
            create: {
                requestId,
                donorId: req.user.id,
                latitude,
                longitude
            }
        });

        // Emit socket so requester's tracking page activates live map
        try {
            const { getIo } = require('../socket');
            const io = getIo();
            io.to(`track_${requestId}`).emit('trackingStarted', { requestId, liveLocation });
        } catch (e) {
            console.warn('Socket emit failed (non-critical):', e.message);
        }

        // Notify requester that donor is on the way (only once)
        const existingNotif = await prisma.notification.findFirst({
            where: { bloodRequestId: requestId, title: { contains: 'on the way' } }
        });
        if (!existingNotif) {
            await prisma.notification.create({
                data: {
                    recipientId: request.requesterId,
                    type: 'general',
                    title: '\ud83d\ude97 Donor is on the way!',
                    message: `${req.user.name} has started their journey to ${request.hospital}. You can now track their live location.`,
                    bloodRequestId: requestId,
                    patientName: request.patientName,
                    hospital: request.hospital,
                    city: request.city,
                    urgency: request.urgency,
                    unitsNeeded: request.unitsNeeded,
                    contactNumber: request.contactNumber,
                }
            });
        }

        res.json({ message: 'Journey started', liveLocation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/requests/:id/journey/location
// @desc    Update donor's live GPS location during journey
router.put('/:id/journey/location', protect, async (req, res) => {
    try {
        const { latitude, longitude, speed, heading } = req.body;
        const requestId = req.params.id;

        const liveLocation = await prisma.liveLocation.update({
            where: { requestId },
            data: {
                latitude,
                longitude,
                speed: speed ?? null,
                heading: heading ?? null,
                updatedAt: new Date()
            }
        });

        // Broadcast location change to tracking room via socket
        try {
            const { getIo } = require('../socket');
            const io = getIo();
            io.to(`track_${requestId}`).emit('donorLocationChanged', {
                requestId, latitude, longitude, speed, heading
            });
        } catch (e) { /* non-critical */ }

        res.json({ message: 'Location updated', liveLocation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

