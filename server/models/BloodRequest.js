const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    patientName: {
        type: String,
        required: [true, 'Please add patient name']
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: [true, 'Please select blood group']
    },
    city: {
        type: String,
        required: [true, 'Please add city']
    },
    hospital: {
        type: String,
        required: [true, 'Please add hospital name']
    },
    contactNumber: {
        type: String,
        required: [true, 'Please add contact number']
    },
    unitsNeeded: {
        type: Number,
        required: true,
        default: 1
    },
    urgency: {
        type: String,
        enum: ['normal', 'urgent', 'critical'],
        default: 'normal'
    },
    status: {
        type: String,
        enum: ['pending', 'fulfilled', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
