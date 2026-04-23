import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import SearchDonors from './pages/SearchDonors';
import AdminDashboard from './pages/AdminDashboard';
import RequesterDashboard from './pages/RequesterDashboard';

function HomePage() {
    const { user } = useAuth();

    return (
        <div className="page-container">
            <div className="hero fade-in">
                <h1>
                    Save Lives with <span className="highlight">BloodConnect</span>
                </h1>
                <p>
                    Find blood donors quickly during emergencies. Connect with donors in your city,
                    submit blood requests, and help save lives – all in one platform.
                </p>
                <div className="hero-actions">
                    <Link to="/search" className="btn btn-primary">
                        🔍 Find Donors
                    </Link>
                    {!user ? (
                        <Link to="/register" className="btn btn-secondary">
                            ✨ Join as Donor
                        </Link>
                    ) : (
                        <Link
                            to={user.role === 'admin' ? '/admin' : user.role === 'donor' ? '/donor-dashboard' : '/requester-dashboard'}
                            className="btn btn-secondary"
                        >
                            📊 My Dashboard
                        </Link>
                    )}
                </div>
            </div>

            <div className="features-grid fade-in">
                <div className="feature-card">
                    <div className="feature-icon">🔍</div>
                    <h3>Quick Search</h3>
                    <p>Find available donors by blood group and city instantly. Every second counts in an emergency.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">🛡️</div>
                    <h3>Secure & Verified</h3>
                    <p>JWT-based authentication ensures your data is safe. Admin-verified donor profiles you can trust.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">📱</div>
                    <h3>Mobile Friendly</h3>
                    <p>Access BloodConnect from any device. Search, request, and manage donations on the go.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">🆘</div>
                    <h3>Emergency Requests</h3>
                    <p>Submit urgent blood requests with priority levels. Get matched with available donors fast.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">👤</div>
                    <h3>Donor Profiles</h3>
                    <p>Complete donor profiles with blood group, location, availability status, and donation history.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h3>Admin Dashboard</h3>
                    <p>Comprehensive admin panel with statistics, donor management, and request tracking.</p>
                </div>
            </div>
        </div>
    );
}



function App() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/search" element={<SearchDonors />} />
                <Route path="/donor-dashboard" element={
                    <ProtectedRoute roles={['donor']}>
                        <DonorDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/requester-dashboard" element={
                    <ProtectedRoute roles={['requester']}>
                        <RequesterDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/admin" element={
                    <ProtectedRoute roles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;
