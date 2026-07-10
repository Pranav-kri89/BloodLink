import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();

    console.log("===== ProtectedRoute =====");
    console.log("Loading:", loading);
    console.log("User:", user);
    console.log("Role:", user?.role);
    console.log("Required Roles:", roles);
    console.log("==========================");

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        console.log("❌ Redirect: user is null");
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        console.log("❌ Redirect: role mismatch", {
            userRole: user.role,
            allowed: roles
        });
        return <Navigate to="/" replace />;
    }

    console.log("✅ Access granted");
    return children;
}

export default ProtectedRoute;