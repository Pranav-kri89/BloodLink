const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send email notification to a donor about a blood request
 */
const sendDonorNotification = async (donorEmail, donorName, requestDetails) => {
    const { patientName, bloodGroup, city, hospital, contactNumber, unitsNeeded, urgency, requesterName, requesterEmail } = requestDetails;

    const urgencyColors = { normal: '#4CAF50', urgent: '#FF9800', critical: '#F44336' };
    const urgencyLabel = urgency.charAt(0).toUpperCase() + urgency.slice(1);

    const mailOptions = {
        from: `"BloodConnect 🩸" <${process.env.EMAIL_USER}>`,
        to: donorEmail,
        subject: `🆘 ${urgencyLabel} Blood Request - ${bloodGroup} needed in ${city}`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #eee; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #dc3545, #a71d2a); padding: 24px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 24px;">🩸 BloodConnect</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Blood Donation Request Alert</p>
                </div>
                
                <div style="padding: 24px;">
                    <p style="font-size: 16px; margin-bottom: 16px;">Dear <strong>${donorName}</strong>,</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #ccc;">
                        A patient urgently needs your help! A blood donation request has been submitted that matches your blood group and location.
                    </p>

                    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <h3 style="margin: 0 0 12px; color: #ff6b6b; font-size: 16px;">📋 Request Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 8px 0; color: #999; width: 140px;">Patient Name</td><td style="padding: 8px 0; font-weight: 600;">${patientName}</td></tr>
                            <tr><td style="padding: 8px 0; color: #999;">Blood Group</td><td style="padding: 8px 0;"><span style="background: #dc3545; color: white; padding: 2px 10px; border-radius: 12px; font-weight: 700;">${bloodGroup}</span></td></tr>
                            <tr><td style="padding: 8px 0; color: #999;">City</td><td style="padding: 8px 0;">${city}</td></tr>
                            <tr><td style="padding: 8px 0; color: #999;">Hospital</td><td style="padding: 8px 0; font-weight: 600;">${hospital}</td></tr>
                            <tr><td style="padding: 8px 0; color: #999;">Units Needed</td><td style="padding: 8px 0;">${unitsNeeded} unit(s)</td></tr>
                            <tr><td style="padding: 8px 0; color: #999;">Urgency</td><td style="padding: 8px 0;"><span style="background: ${urgencyColors[urgency]}; color: white; padding: 2px 10px; border-radius: 12px; font-weight: 600;">${urgencyLabel}</span></td></tr>
                            <tr><td style="padding: 8px 0; color: #999;">Contact Number</td><td style="padding: 8px 0; font-weight: 600;">${contactNumber}</td></tr>
                        </table>
                    </div>

                    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <h3 style="margin: 0 0 8px; color: #ff6b6b; font-size: 16px;">👤 Requested By</h3>
                        <p style="margin: 4px 0; color: #ccc;">${requesterName} (${requesterEmail})</p>
                    </div>

                    <p style="font-size: 14px; color: #999; line-height: 1.6; margin-top: 20px;">
                        If you are available to donate, please contact the requester or visit the hospital directly. Your donation can save a life! 🙏
                    </p>
                </div>

                <div style="background: rgba(0,0,0,0.3); padding: 16px; text-align: center; font-size: 12px; color: #666;">
                    <p style="margin: 0;">You received this email because you are a registered donor on BloodConnect.</p>
                    <p style="margin: 4px 0 0;">Blood Group: ${bloodGroup} | City: ${city}</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Notification sent to ${donorEmail}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send to ${donorEmail}:`, error.message);
        return false;
    }
};

module.exports = { sendDonorNotification };
