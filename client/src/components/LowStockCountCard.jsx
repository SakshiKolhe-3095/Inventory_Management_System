// client/src/components/LowStockCountCard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';

/**
 * Component to display a summary count of low stock products as a dashboard card.
 * Fetches its own data.
 */
function LowStockCountCard() {
    const { isAuthenticated, user } = useAuth();
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [lowStockCount, setLowStockCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLowStockCount = useCallback(async () => {
        // Ensure user is authenticated and is an admin before attempting to fetch
        if (!isAuthenticated || user?.role !== 'admin') {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await API.get('/reports/low-stock-count'); // Axios instance handles token
            setLowStockCount(response.data.count);
        } catch (err) {
            console.error('Failed to fetch low stock count:', err);
            setError('Failed to load low stock count.');
            showTimedMessage('Failed to load low stock count.', 3000, 'error');
            setLowStockCount(0); // Reset count on error
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user, showTimedMessage]);

    useEffect(() => {
        fetchLowStockCount();
    }, [fetchLowStockCount]);

    const handleViewReport = () => {
        navigate('/admin/low-stock-report'); // Navigate to a dedicated low stock report page
    };

    const cardBgClass = theme === 'dark'
        ? 'bg-gradient-to-br from-red-900 to-orange-800 text-white shadow-lg'
        : 'bg-red-100 text-red-800 shadow-md';
    const buttonClass = theme === 'dark'
        ? 'bg-red-700 hover:bg-red-600 text-white'
        : 'bg-red-600 hover:bg-red-700 text-white';

    // Only render this card if the user is an admin
    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    return (
        // Removed h-48 and adjusted py-6 for better vertical spacing
        <div className={`p-6 py-8 rounded-xl flex flex-col justify-between transition-all duration-300 ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center">
                    <AlertTriangle className="w-6 h-6 mr-2" /> Low Stock Alerts
                </h3>
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            </div>
            {error ? (
                <p className="text-sm">{error}</p>
            ) : (
                <>
                    <p className="text-4xl font-bold mb-2">
                        {lowStockCount}
                    </p>
                    <p className="text-sm">
                        {lowStockCount === 1 ? 'product is' : 'products are'} currently below threshold.
                    </p>
                </>
            )}
            <button
                onClick={handleViewReport}
                className={`mt-4 w-full py-2 rounded-lg flex items-center justify-center gap-2
                    font-semibold transition-colors duration-200 ${buttonClass}`}
            >
                View Low Stock Report <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
}

export default LowStockCountCard;
