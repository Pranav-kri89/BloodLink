import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SkeletonDonorCard = () => (
    <div className="donor-card">
        <div className="donor-card-header">
            <div className="skeleton skeleton-avatar"></div>
            <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
            </div>
        </div>
        <div className="donor-card-body">
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text short"></div>
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
            <div className="skeleton skeleton-button"></div>
        </div>
    </div>
);

function SearchDonors() {
    const { user, token } = useAuth();
    const [filters, setFilters] = useState({ bloodGroup: '', city: '' });
    const [donors, setDonors] = useState([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    // Blood Request Modal
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState({
        patientName: '',
        bloodGroup: '',
        city: '',
        hospital: '',
        contactNumber: '',
        unitsNeeded: 1,
        urgency: 'normal'
    });
    const [requestMessage, setRequestMessage] = useState({ type: '', text: '' });
    const [submitting, setSubmitting] = useState(false);

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const cities = ['Bantwal', 'Belthangady', 'Dharmasthala', 'Kadaba', 'Kanhangad', 'Kasaragod', 'Kundapura', 'Mangaluru', 'Manjeshwar', 'Manipal', 'Moodbidri', 'Mulki', 'Puttur', 'Sullia', 'Surathkal', 'Udupi', 'Uppala', 'Vitla'];

    const cityHospitals = {
        'Bantwal': ['Bantwal Government Hospital', 'SDM Hospital Bantwal'],
        'Belthangady': ['Belthangady Community Hospital', 'Government Hospital Belthangady'],
        'Dharmasthala': ['SDM Hospital Dharmasthala'],
        'Kadaba': ['Government Hospital Kadaba', 'Kadaba Community Hospital'],
        'Kanhangad': ['Co-operative Hospital Kanhangad', 'Taluk Hospital Kanhangad'],
        'Kasaragod': ['General Hospital Kasaragod', 'KIMS Hospital Kasaragod'],
        'Kundapura': ['Government Hospital Kundapura', 'Kundapura Community Hospital'],
        'Mangaluru': ['AJ Hospital & Research Centre', 'Father Muller Medical College Hospital', 'KMC Hospital Attavar', 'Yenepoya Specialty Hospital'],
        'Manjeshwar': ['Government Hospital Manjeshwar', 'Manjeshwar Taluk Hospital'],
        'Manipal': ['Kasturba Hospital Manipal', 'Manipal Hospital Manipal'],
        'Moodbidri': ['Alvas Health Centre Moodbidri', 'Moodbidri Government Hospital'],
        'Mulki': ['Government Hospital Mulki', 'Mulki Community Hospital'],
        'Puttur': ['Puttur Government Hospital', 'Sanjeevini Hospital Puttur'],
        'Sullia': ['Government Hospital Sullia', 'Sullia Taluk Hospital'],
        'Surathkal': ['NITK Health Centre Surathkal', 'Surathkal Community Hospital'],
        'Udupi': ['District Hospital Udupi', 'Manipal Hospital Udupi'],
        'Uppala': ['PHC Uppala', 'Uppala Co-operative Hospital'],
        'Vitla': ['PHC Vitla', 'Vitla Community Hospital']
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearched(true);

        try {
            const params = new URLSearchParams();
            if (filters.bloodGroup) params.append('bloodGroup', filters.bloodGroup);
            if (filters.city) params.append('city', filters.city);

            const res = await axios.get(`/api/donors/search?${params.toString()}`);
            
            // Filter out the logged-in user so they don't see themselves
            const results = user ? res.data.filter(d => d._id !== user._id) : res.data;
            setDonors(results);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setRequestMessage({ type: '', text: '' });

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.post('/api/requests', requestForm, config);
            const { matchingDonors, notifiedDonors } = res.data;
            let successText = 'Blood request submitted successfully!';
            if (matchingDonors > 0) {
                successText += ` 📧 Found ${matchingDonors} matching donor(s)`;
                if (notifiedDonors > 0) successText += `, ${notifiedDonors} notified via email.`;
                else successText += '.';
            } else {
                successText += ' No matching donors found in your area yet.';
            }
            setRequestMessage({ type: 'success', text: successText });
            setRequestForm({
                patientName: '',
                bloodGroup: '',
                city: '',
                hospital: '',
                contactNumber: '',
                unitsNeeded: 1,
                urgency: 'normal'
            });
            setTimeout(() => setShowRequestModal(false), 2000);
        } catch (err) {
            setRequestMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit request' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDirectRequest = (donor) => {
        if (!user) {
            alert('Please login to request blood');
            return;
        }
        setRequestForm({
            ...requestForm,
            bloodGroup: donor.bloodGroup || '',
            city: donor.city || '',
            hospital: ''
        });
        setShowRequestModal(true);
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h1>Find Blood Donors</h1>
                <p>Search available donors by blood group and city</p>
            </div>

            {/* Filter Bar */}
            <form className="filter-bar" onSubmit={handleSearch}>
                <div className="form-group">
                    <label>Blood Group</label>
                    <select
                        className="form-control"
                        value={filters.bloodGroup}
                        onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
                    >
                        <option value="">All Blood Groups</option>
                        {bloodGroups.map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>City</label>
                    <select
                        className="form-control"
                        value={filters.city}
                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    >
                        <option value="">All Cities</option>
                        {cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Searching...' : '🔍 Search'}
                    </button>
                    {user && (
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => setShowRequestModal(true)}
                        >
                            🆘 Request Blood
                        </button>
                    )}
                </div>
            </form>

            {/* Results */}
            {loading ? (
                <div className="donors-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonDonorCard key={i} />)}
                </div>
            ) : searched && donors.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">😔</div>
                    <p>No donors found matching your criteria. Try broadening your search.</p>
                </div>
            ) : (
                <div className="donors-grid">
                    {donors.map((donor) => (
                        <div key={donor._id} className="donor-card">
                            <div className="donor-card-header">
                                <div className="donor-avatar">
                                    {donor.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="donor-name">{donor.name}</div>
                                    <div className="donor-email">{donor.email}</div>
                                </div>
                            </div>
                            <div className="donor-card-body">
                                <div className="donor-info-row">
                                    <span className="info-icon">🩸</span>
                                    <span>Blood Group: </span>
                                    <span className="blood-group-badge">{donor.bloodGroup}</span>
                                </div>
                                <div className="donor-info-row">
                                    <span className="info-icon">📍</span>
                                    <span>City: {donor.city || 'Not specified'}</span>
                                </div>
                                <div className="donor-info-row">
                                    <span className="info-icon">📞</span>
                                    <span>Phone: {donor.phone}</span>
                                </div>
                                <div className="donor-info-row">
                                    <span className="info-icon">✅</span>
                                    <span className={`availability-badge ${donor.available ? 'available' : 'unavailable'}`}>
                                        <span className="dot"></span>
                                        {donor.available ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                {donor.lastDonationDate && (
                                    <div className="donor-info-row">
                                        <span className="info-icon">📅</span>
                                        <span>Last Donated: {new Date(donor.lastDonationDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                            {user && donor.available && (
                                <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ width: '100%' }}
                                        onClick={() => handleDirectRequest(donor)}
                                    >
                                        🆘 Request Donor
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Blood Request Modal */}
            {showRequestModal && (
                <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>🆘 Submit Blood Request</h2>

                        {requestMessage.text && (
                            <div className={`alert ${requestMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                                {requestMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleRequestSubmit}>
                            <div className="form-group">
                                <label>Patient Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter patient name"
                                    value={requestForm.patientName}
                                    onChange={(e) => setRequestForm({ ...requestForm, patientName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Blood Group Needed</label>
                                    <select
                                        className="form-control"
                                        value={requestForm.bloodGroup}
                                        onChange={(e) => setRequestForm({ ...requestForm, bloodGroup: e.target.value })}
                                        required
                                    >
                                        <option value="">Select</option>
                                        {bloodGroups.map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>City</label>
                                    <select
                                        className="form-control"
                                        value={requestForm.city}
                                        onChange={(e) => setRequestForm({ ...requestForm, city: e.target.value, hospital: '' })}
                                        required
                                    >
                                        <option value="">Select City</option>
                                        {cities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Hospital Name</label>
                                <select
                                    className="form-control"
                                    value={requestForm.hospital}
                                    onChange={(e) => setRequestForm({ ...requestForm, hospital: e.target.value })}
                                    required
                                    disabled={!requestForm.city}
                                >
                                    <option value="">{requestForm.city ? 'Select Hospital' : 'Select a city first'}</option>
                                    {requestForm.city && (cityHospitals[requestForm.city] || []).map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Contact Number</label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        placeholder="Phone number"
                                        value={requestForm.contactNumber}
                                        onChange={(e) => setRequestForm({ ...requestForm, contactNumber: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Units Needed</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        min="1"
                                        max="10"
                                        value={requestForm.unitsNeeded}
                                        onChange={(e) => setRequestForm({ ...requestForm, unitsNeeded: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Urgency Level</label>
                                <select
                                    className="form-control"
                                    value={requestForm.urgency}
                                    onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowRequestModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchDonors;
