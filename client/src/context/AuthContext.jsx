import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
    const { user: clerkUser } = useClerkUser();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(null);

    // Setup Axios interceptor to automatically inject Clerk token
    useEffect(() => {
        const interceptor = axios.interceptors.request.use(async (config) => {
            if (isSignedIn) {
                const clerkToken = await getToken();
                if (clerkToken) {
                    config.headers.Authorization = `Bearer ${clerkToken}`;
                }
            }
            return config;
        });
        return () => axios.interceptors.request.eject(interceptor);
    }, [isSignedIn, getToken]);

    // Sync user with backend whenever Clerk session changes
    useEffect(() => {
        // console.error("DEBUG - AuthContext state:", { isLoaded, isSignedIn, clerkUser: !!clerkUser });
        if (!isLoaded) return;

        if (isSignedIn && clerkUser) {
            setToken("active"); // Dummy token to satisfy `if (!token)` checks in other components
            syncUser();
        } else {
            setUser(null);
            setToken(null);
            setLoading(false);
        }
    }, [isLoaded, isSignedIn, clerkUser]);

    const syncUser = async () => {
        try {
            console.log("syncUser called!");
            setLoading(true);
            const clerkToken = await getToken();
            console.log("Got clerk token");
            const config = { headers: { Authorization: `Bearer ${clerkToken}` } };

            // Try to sync/fetch
            const res = await axios.post('/api/auth/sync', {
                email: clerkUser.primaryEmailAddress?.emailAddress,
                phone: clerkUser.primaryPhoneNumber?.phoneNumber,
                name: clerkUser.fullName
                // NOTE: We intentionally do NOT send clerkUser.imageUrl here.
                // The user may have uploaded a custom profile picture via the dashboard,
                // and we never want to overwrite it with the Clerk avatar on login.
            }, config);

            console.log("Sync response:", res.data);
            console.log("Sync response:", res.data);
            setUser(res.data);
            setError(null);
        } catch (err) {
            console.error("syncUser error:", err);
            if (err.response?.data?.code === 'NEEDS_ONBOARDING') {
                setUser({ onboardingRequired: true });
            } else {
                setError('Failed to sync user with database.');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadUser = syncUser; // Alias for compatibility

    const login = async () => {
        throw new Error('Login is now handled by Clerk UI. Please use the SignInButton.');
    };

    const register = async () => {
        throw new Error('Registration is now handled by Clerk UI. Please use the SignUpButton.');
    };

    const logout = async () => {
        await signOut();
        setUser(null);
        setToken(null);
    };

    const clearError = () => {
        setError(null);
    };

    const updateUser = (data) => {
        setUser(prev => ({ ...prev, ...data }));
    };

    return (
        <AuthContext.Provider value={{
            user,
            token, // Just a boolean-ish flag now. Actual token is injected via Axios interceptor.
            loading,
            error,
            login,
            register,
            logout,
            clearError,
            updateUser,
            loadUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
