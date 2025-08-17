import React, { useState, useEffect, useCallback } from 'react';
import API from '../../api/axios.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNotification } from '../../components/Notification.jsx';
import { AlertTriangle, Mail, Loader2, RefreshCw } from 'lucide-react';

function LowStockReportPage() {
    const { isAuthenticated, loading: authLoading, token, user } = useAuth();
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();

    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [loadingReport, setLoadingReport] = useState(true);
    const [errorReport, setErrorReport] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [sendingAlerts, setSendingAlerts] = useState({}); // State to track which alert is being sent

    const fetchLowStockReport = useCallback(async () => {
        setLoadingReport(true);
        setErrorReport(null);
        setIsRefreshing(true);

        if (!token) {
            setLoadingReport(false);
            setIsRefreshing(false);
            showTimedMessage('Authentication required to fetch low stock report.', 3000, 'error');
            return;
        }

        try {
            const response = await API.get('/reports/low-stock', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data && Array.isArray(response.data)) {
                setLowStockProducts(response.data);
                // The previous debug logs confirmed the backend sends the category name directly
                // in the 'category' field, not as an object with a 'name' property.
                // console.log('Frontend: Low Stock Products received:', response.data);
                // response.data.forEach(product => {
                //     console.log(`Frontend: Product ID: ${product._id}, Category:`, product.category);
                // });
                showTimedMessage('Low stock report loaded successfully!', 2000, 'success');
            } else {
                setLowStockProducts([]);
                showTimedMessage('No low stock products found.', 3000, 'info');
            }
        } catch (err) {
            console.error('Failed to fetch low stock report:', err);
            setErrorReport(err.response?.data?.message || 'Failed to load low stock report. Please try again.');
            showTimedMessage(err.response?.data?.message || 'Failed to load low stock report.', 5000, 'error');
        } finally {
            setLoadingReport(false);
            setIsRefreshing(false);
        }
    }, [token, showTimedMessage]);

    const handleSendAlert = useCallback(async (productId) => {
        setSendingAlerts(prev => ({ ...prev, [productId]: true }));
        try {
            const response = await API.post(`/reports/low-stock/alert/${productId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            showTimedMessage(response.data.message || `Low stock alert sent for product ID: ${productId}`, 3000, 'success');
        } catch (err) {
            console.error(`Failed to send alert for product ${productId}:`, err);
            showTimedMessage(err.response?.data?.message || `Failed to send alert for product ${productId}.`, 5000, 'error');
        } finally {
            setSendingAlerts(prev => ({ ...prev, [productId]: false }));
        }
    }, [token, showTimedMessage]);


    useEffect(() => {
        if (!authLoading && isAuthenticated && user?.role === 'admin') {
            fetchLowStockReport();
        } else if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
            showTimedMessage('Access denied. You must be an admin to view this page.', 3000, 'error');
        }
    }, [isAuthenticated, authLoading, user, fetchLowStockReport, showTimedMessage]);


    if (authLoading || loadingReport) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="flex items-center space-x-3 text-lg font-medium text-blue-600 dark:text-blue-300">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span>Loading low stock report...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <p className="text-red-600 dark:text-red-300">Access Denied. You must be logged in as an admin to view this page.</p>
            </div>
        );
    }

    return (
        <div className={`relative p-6 rounded-xl shadow-lg transition-colors duration-300
            ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' : 'bg-white'}
            ${theme === 'dark' ? 'shadow-2xl' : 'shadow-lg'}
        `}>
            {theme === 'dark' && (
                <div className="absolute inset-0 opacity-20 rounded-xl" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
            )}

            <div className="relative z-10">
                <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-6 p-4 rounded-lg border transition-colors duration-300
                    ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}
                `}>
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-3 rounded-xl shadow-lg">
                            <AlertTriangle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-yellow-800 dark:text-white">Low Stock Report</h1>
                            <p className="text-yellow-700 mt-1 dark:text-yellow-200">Products currently below their defined low stock threshold.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <button
                            onClick={fetchLowStockReport}
                            disabled={isRefreshing}
                            className={`p-2 rounded-xl border transition-all duration-200 ${isRefreshing ? 'animate-spin' : ''}
                                ${theme === 'dark' ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}
                                disabled:opacity-60 disabled:cursor-not-allowed
                            `}
                        >
                            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-blue-200" />
                        </button>
                    </div>
                </div>

                {errorReport && (
                    <div className="p-4 mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center">
                        <p>{errorReport}</p>
                    </div>
                )}

                {lowStockProducts.length === 0 && !loadingReport && !errorReport ? (
                    <div className="p-8 text-center text-gray-600 dark:text-gray-300">
                        <p>No products are currently below their low stock threshold. Good job!</p>
                    </div>
                ) : (
                    <div className={`overflow-x-auto rounded-xl shadow-md border transition-colors duration-300
                        ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                    `}>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tl-xl">
                                        Product Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        SKU
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Category
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Current Stock
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Threshold
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tr-xl">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {lowStockProducts.map((product) => (
                                    <tr key={product._id} className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors duration-150`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {product.sku}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {/* ✅ FIX: Directly use product.category as it's a string */}
                                            {product.category || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {product.lowStockThreshold}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                            <button
                                                onClick={() => handleSendAlert(product._id)}
                                                disabled={sendingAlerts[product._id]}
                                                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white
                                                    ${sendingAlerts[product._id] ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200
                                                `}
                                            >
                                                {sendingAlerts[product._id] ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Mail className="w-4 h-4 mr-2" />
                                                )}
                                                {sendingAlerts[product._id] ? 'Sending...' : 'Send Alert'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LowStockReportPage;
