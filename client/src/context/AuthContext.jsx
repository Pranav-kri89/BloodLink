import { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const initialState = {
    user: null,
    token: localStorage.getItem('token') || null,
    loading: true,
    error: null
};

function authReducer(state, action) {
    switch (action.type) {
        case 'AUTH_SUCCESS':
            localStorage.setItem('token', action.payload.token);
            return {
                ...state,
                user: action.payload,
                token: action.payload.token,
                loading: false,
                error: null
            };
        case 'USER_LOADED':
            return {
                ...state,
                user: action.payload,
                loading: false,
                error: null
            };
        case 'AUTH_ERROR':
            localStorage.removeItem('token');
            return {
                ...state,
                user: null,
                token: null,
                loading: false,
                error: action.payload
            };
        case 'LOGOUT':
            localStorage.removeItem('token');
            return {
                ...state,
                user: null,
                token: null,
                loading: false,
                error: null
            };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        case 'UPDATE_USER':
            return { ...state, user: { ...state.user, ...action.payload } };
        default:
            return state;
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Load user on mount if token exists
    useEffect(() => {
        if (state.token) {
            loadUser();
        } else {
            dispatch({ type: 'AUTH_ERROR', payload: null });
        }
    }, []);

    const loadUser = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${state.token || localStorage.getItem('token')}` }
            };
            const res = await axios.get('/api/auth/me', config);
            dispatch({ type: 'USER_LOADED', payload: res.data });
        } catch (err) {
            dispatch({ type: 'AUTH_ERROR', payload: 'Session expired' });
        }
    };

    const login = async (email, password) => {
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            dispatch({ type: 'AUTH_SUCCESS', payload: res.data });
            return res.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            dispatch({ type: 'AUTH_ERROR', payload: message });
            throw new Error(message);
        }
    };

    const register = async (userData) => {
        try {
            const res = await axios.post('/api/auth/register', userData);
            dispatch({ type: 'AUTH_SUCCESS', payload: res.data });
            return res.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            dispatch({ type: 'AUTH_ERROR', payload: message });
            throw new Error(message);
        }
    };

    const logout = () => {
        dispatch({ type: 'LOGOUT' });
    };

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const updateUser = (data) => {
        dispatch({ type: 'UPDATE_USER', payload: data });
    };

    return (
        <AuthContext.Provider value={{
            user: state.user,
            token: state.token,
            loading: state.loading,
            error: state.error,
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
