// client/src/auth/AuthContext.jsx

import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    useCallback,
} from 'react';
import API from '../api/axios'; // Import your configured API instance
import { useNotification } from '../components/Notification.jsx'; // Assuming you have this

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!token);
    const [loadingAuthState, setLoadingAuthState] = useState(true);
    const { showTimedMessage } = useNotification();

    // The API.interceptors.request.use in axios.js already handles setting the Authorization header.
    // We just need to ensure localStorage is updated and the token state reflects it.

    const logout = useCallback(() => {
        console.log('Logging out...');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        // The API interceptor will automatically remove the header when token is null
        showTimedMessage('Logged out successfully.', 3000, 'info');
    }, [showTimedMessage]);

    // Function to fetch user profile
    const fetchUserProfile = useCallback(async () => {
        console.log('fetchUserProfile called. Current token in state:', token ? 'Present' : 'Not present');
        const currentTokenFromStorage = localStorage.getItem('token'); // Get token from storage for this check

        if (!currentTokenFromStorage) {
            console.log('No token in localStorage for fetchUserProfile, setting loadingAuthState to false.');
            setUser(null);
            setIsAuthenticated(false);
            setLoadingAuthState(false);
            return;
        }

        try {
            // API instance from axios.js will automatically attach the token from localStorage
            console.log('Attempting to fetch profile with token from localStorage...');
            const response = await API.get('/auth/profile');
            setUser(response.data);
            setIsAuthenticated(true);
            console.log('User profile fetched successfully:', response.data.email);
        } catch (error) {
            console.error('🔐 Auth failed (fetchUserProfile):', error.response?.status, error.response?.data?.message || error.message);
            // If 401, the interceptor in axios.js should handle logout, but we ensure here too.
            if (error.response?.status === 401) {
                logout(); // Call logout to clear state and localStorage
            } else {
                // For other errors, just clear user/auth state
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('token');
                setToken(null);
            }
            showTimedMessage(error.response?.data?.message || 'Authentication failed. Please log in again.', 5000, 'error');
        } finally {
            setLoadingAuthState(false);
            console.log('fetchUserProfile finished. loadingAuthState set to false.');
        }
    }, [token, logout, showTimedMessage]); // Added token to dependencies

    // Login function
    const login = useCallback(async (email, password) => {
        setLoadingAuthState(true); // Indicate that auth state is changing
        try {
            const response = await API.post('/auth/login', { email, password });
            const newToken = response.data.token;
            localStorage.setItem('token', newToken); // Store token
            setToken(newToken); // Update state, which will trigger useEffect to fetch profile
            setIsAuthenticated(true); // Set authenticated
            // fetchUserProfile will be called by useEffect due to token change
            showTimedMessage('Login successful!', 3000, 'success');
            return true;
        } catch (error) {
            console.error('❌ Login failed:', error.response?.data?.message || error.message);
            showTimedMessage(error.response?.data?.message || 'Login failed.', 5000, 'error');
            setLoadingAuthState(false); // Reset loading on login failure
            return false;
        }
    }, [showTimedMessage]);

    // Initial check on component mount and whenever token state changes
    useEffect(() => {
        console.log('AuthContext useEffect triggered. Token:', token);
        if (token) {
            fetchUserProfile();
        } else {
            setLoadingAuthState(false); // No token, so no auth state to load
        }
    }, [token, fetchUserProfile]); // Depend on token and fetchUserProfile

    const value = {
        user,
        token,
        isAuthenticated,
        loadingAuthState,
        login,
        logout,
        // No authAxios needed here, components will use the global API instance
        isAdmin: user?.role === 'admin',
        isClient: user?.role === 'client',
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Render children only when auth state is done loading to prevent flickering */}
            {!loadingAuthState && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
