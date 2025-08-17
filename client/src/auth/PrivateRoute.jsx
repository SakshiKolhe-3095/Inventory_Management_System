// client/src/auth/PrivateRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx'; // Ensure this path is correct

const PrivateRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, loading: authLoading, user } = useAuth();

    // --- ADDED CONSOLE LOGS HERE ---
    console.log('PrivateRoute Render:');
    console.log('  authLoading (PrivateRoute):', authLoading);
    console.log('  isAuthenticated (PrivateRoute):', isAuthenticated);
    console.log('  user (PrivateRoute):', user);
    console.log('  allowedRoles (PrivateRoute):', allowedRoles);
    // --- END CONSOLE LOGS ---

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="flex items-center space-x-3 text-lg font-medium text-blue-600 dark:text-blue-300">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log('PrivateRoute: Not authenticated, redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    // Check for roles if specified
    if (allowedRoles.length > 0) {
        if (!user || !user.role || !allowedRoles.includes(user.role)) {
            console.warn(`PrivateRoute: Access Denied. User role "${user?.role}" not in allowed roles: ${allowedRoles.join(', ')}. Redirecting.`);
            // You can redirect to a specific unauthorized page or back to a general dashboard
            return <Navigate to="/login" replace />; // Or to "/unauthorized" if you create one
        }
    }

    console.log('PrivateRoute: Access Granted.');
    return children;
};

export default PrivateRoute;