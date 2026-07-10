import React, { useRef, useEffect } from 'react';
import './Certificate.css';
import { downloadCertificate } from './certificateUtils';
import { Download, X } from 'lucide-react';

import watermarkLogo from './assets/watermark-logo.png';
import bloodlinkLogo from './assets/bloodlink-logo.png';
import calendarIcon from './assets/calendar.png';
import bloodDropIcon from './assets/blooddrop.png';
import hospitalIcon from './assets/hospital.png';
import badgeIcon from './assets/badge.png';

const Certificate = ({ data, onClose }) => {
    const certificateRef = useRef(null);
    const pageRef = useRef(null);

    const handleDownload = () => {
        downloadCertificate(certificateRef, pageRef, data.name);
    };

    const getFontSize = (text, defaultSize, step = 15) => {
        if (!text) return `${defaultSize}px`;
        const len = text.length;
        if (len > step * 2) return `${defaultSize * 0.6}px`;
        if (len > step * 1.5) return `${defaultSize * 0.75}px`;
        if (len > step) return `${defaultSize * 0.85}px`;
        return `${defaultSize}px`;
    };

    const maxHospitalLen = Math.max((data.hospital || '').length, (data.city || '').length);
    const hospitalFontSize = getFontSize('A'.repeat(maxHospitalLen), 22, 12);
    const nameFontSize = getFontSize(data.name, 70, 18);

    useEffect(() => {
        if (certificateRef.current) {
            certificateRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }, []);


    return (
        <div className="bloodlink-certificate-wrapper" style={{ position: 'fixed', inset: 0, zIndex: 99999, minHeight: '100vh', padding: '0', background: 'rgba(0,0,0,0.7)', overflow: 'auto' }}>
            <div className="page" ref={pageRef} style={{ position: 'relative' }}>
                <div className="download-bar" data-print-hide style={{ position: 'absolute', top: '-60px', right: '0', display: 'flex', justifyContent: 'flex-end', padding: '10px 0', gap: '10px', zIndex: 9999 }}>
                    <button className="download-btn" onClick={handleDownload} style={{ padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                        <Download className="w-4 h-4 mr-2" /> Download Certificate
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '8px 12px', background: '#f1f1f1', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#333' }}>
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="certificate" ref={certificateRef}>
                    <img src={watermarkLogo} className="watermark" alt="Watermark" />
                    
                    <header>
                        <div className="brand">
                            <img src={bloodlinkLogo} className="logo" alt="Logo" />
                            <div className="brand-text">
                                <h1><span className="blood">BLOOD</span><span className="link">LINK</span></h1>
                                <p>Connecting Donors. <span>Saving Lives.</span></p>
                            </div>
                        </div>
                    </header>

                    <section className="title">
                        <h2>CERTIFICATE</h2>
                        <h3>OF APPRECIATION</h3>
                        <div className="gold-line"></div>
                    </section>

                    <section className="present">
                        <div className="small-line"></div>
                        <span>Proudly Presented To</span>
                        <div className="small-line"></div>
                    </section>

                    <section className="recipient">
                        <div className="name-wrapper">
                            <h1 id="donorName" style={{ fontSize: nameFontSize, transition: 'font-size 0.3s ease' }}>{data.name}</h1>
                            <div className="name-line"></div>
                        </div>
                    </section>

                    <section className="message">
                        <p>
                            This certificate is proudly awarded in recognition of your selfless blood donation.
                            Your generosity has brought hope to patients in need and made a lasting impact on countless lives.
                        </p>
                        <h4>Your kindness makes a real difference.</h4>
                    </section>

                    <section className="details-card">
                        <div className="item">
                            <img src={calendarIcon} className="icon" alt="Donation Date" />
                            <h5>Donation Date</h5>
                            <h3 id="donationDate">{data.date}</h3>
                        </div>
                        <div className="item">
                            <img src={bloodDropIcon} className="icon" alt="Blood Group" />
                            <h5>Blood Group</h5>
                            <h3 id="bloodGroup">{data.bloodGroup}</h3>
                        </div>
                        <div className="item">
                            <img src={hospitalIcon} className="icon" alt="Hospital" />
                            <h5>Hospital</h5>
                            <h3 id="hospital" style={{ fontSize: hospitalFontSize, transition: 'font-size 0.3s ease' }}>
                                {data.hospital}<br />{data.city}
                            </h3>
                        </div>
                    </section>

                    <img src={badgeIcon} alt="Official Seal" className="certificate-seal" />

                    <section className="certificate-id">
                        Certificate ID : <span id="certificateID">{data.certificateId}</span>
                    </section>

                    <footer>
                        <div className="wave one"></div>
                        <div className="wave two"></div>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default Certificate;
