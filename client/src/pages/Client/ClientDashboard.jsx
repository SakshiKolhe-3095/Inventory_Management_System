// client/src/pages/Client/ClientDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx'; // Assuming AuthContext is in this path
import { useTheme } from '../../context/ThemeContext.jsx'; // Assuming ThemeContext is in this path
import { useNotification } from '../../components/Notification.jsx'; // Assuming Notification is in this path
import API from '../../api/axios.js'; // Assuming your Axios instance

import { Package, Tag, ShoppingCart, Clock, LayoutDashboard } from 'lucide-react'; // Icons for the dashboard

function ClientDashboard() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [loadingData, setLoadingData] = useState(true); // Still useful for recent orders
    const [error, setError] = useState(null);
    const [dashboardStats, setDashboardStats] = useState({
        totalProducts: 0,
        totalCategories: 0,
        recentOrders: [
            // Mock recent orders for demonstration
            { id: 'mock-ord-1', product: 'Mock Product A', quantity: 2, date: '2024-07-20', status: 'Shipped' },
            { id: 'mock-ord-2', product: 'Mock Product B', quantity: 1, date: '2024-07-18', status: 'Pending' },
            { id: 'mock-ord-3', product: 'Mock Product C', quantity: 3, date: '2024-07-15', status: 'Delivered' },
        ]
    });

    const fetchClientDashboardData = useCallback(async () => {
        setLoadingData(true);
        setError(null);
        console.log("Client Dashboard: Attempting to fetch client dashboard data...");
        console.log("Client Dashboard: Current isAuthenticated:", isAuthenticated);
        console.log("Client Dashboard: Current user:", user);

        try {
            // --- HARDCODED STATS ---
            const totalProducts = 14; // Hardcoded value
            const totalCategories = 10; // Hardcoded value
            console.log("Client Dashboard: Products count (hardcoded):", totalProducts);
            console.log("Client Dashboard: Categories count (hardcoded):", totalCategories);
            // --- END HARDCODED STATS ---

            // In a real app, you'd fetch user-specific orders here:
            // console.log("Client Dashboard: Fetching user orders (mocked for now)...");
            // const userOrdersResponse = await API.get(`/orders/user/${user.id}`);
            // const recentOrders = userOrdersResponse.data || [];

            setDashboardStats(prev => ({
                ...prev,
                totalProducts: totalProducts,
                totalCategories: totalCategories,
                // recentOrders: recentOrders.slice(0, 3) // Take top 3 recent orders
            }));
            showTimedMessage('Client dashboard data loaded!', 1500, 'info');
        } catch (err) {
            console.error('Client Dashboard: Failed to fetch data:', err);
            if (err.response) {
                console.error('Client Dashboard: Error response data:', err.response.data);
                console.error('Client Dashboard: Error response status:', err.response.status);
                console.error('Client Dashboard: Error response headers:', err.response.headers);
                if (err.response.status === 400) {
                    setError(`Error 400: Bad Request. Backend validation failed or required data is missing. Details: ${err.response.data.message || 'No message provided.'}`);
                } else if (err.response.status === 401) {
                    setError('Error 401: Unauthorized. Please ensure you are logged in with valid credentials.');
                } else if (err.response.status === 403) {
                    setError('Error 403: Forbidden. You do not have permission to access this resource.');
                } else {
                    setError(`Failed to load dashboard data: ${err.response.data.message || err.response.statusText || 'Unknown error'}. Please check backend logs.`);
                }
            } else if (err.request) {
                console.error('Client Dashboard: Error request:', err.request);
                setError('Failed to load dashboard data: No response received from server. Please check network and backend server.');
            } else {
                console.error('Client Dashboard: Error message:', err.message);
                setError(`Failed to load dashboard data: ${err.message}. Please try again later.`);
            }
            showTimedMessage('Failed to load dashboard data. See console for details.', 5000, 'error');
        } finally {
            setLoadingData(false);
        }
    }, [isAuthenticated, user, showTimedMessage]);

    useEffect(() => {
        console.log("ClientDashboard useEffect triggered. authLoading:", authLoading, "isAuthenticated:", isAuthenticated, "user:", user);
        if (!authLoading && !isAuthenticated) {
            console.log("ClientDashboard: Not authenticated, redirecting to login.");
            navigate('/login');
            showTimedMessage('Please log in to access the client dashboard.', 3000, 'error');
        } else if (!authLoading && isAuthenticated && user?.role === 'admin') {
            console.log("ClientDashboard: Authenticated as admin, redirecting to admin dashboard.");
            navigate('/admin/dashboard');
            showTimedMessage('Redirecting to Admin Dashboard.', 2000, 'info');
        } else if (!authLoading && isAuthenticated && user?.role === 'client') {
            console.log("ClientDashboard: Authenticated as client, fetching dashboard data.");
            fetchClientDashboardData();
        }
    }, [isAuthenticated, user, authLoading, navigate, showTimedMessage, fetchClientDashboardData]);

    // Stat Card Component for reuse
    const StatCard = ({ Icon, title, value, isLoading, gradientFrom, gradientTo }) => (
        <div className={`bg-white bg-opacity-90 dark:bg-gray-700 dark:bg-opacity-80 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-600 hover:shadow-2xl transition-all duration-300`}>
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-blue-200">{title}</p>
                    {isLoading ? (
                        <div className="h-7 w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    ) : (
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</h3>
                    )}
                </div>
            </div>
        </div>
    );

    if (authLoading || (isAuthenticated && user?.role !== 'client' && !loadingData)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-lg font-medium text-blue-600 dark:text-blue-300">Loading client dashboard...</span>
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== 'client') {
        return null; // Will be redirected by useEffect
    }

    return (
        <div className={`min-h-screen p-6
            ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}
            transition-colors duration-300`}>
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
                    {/* Dashboard Header Section */}
                    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-6 p-4 rounded-lg border transition-colors duration-300
                        ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}
                    `}>
                        <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
                                <LayoutDashboard className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-blue-800 dark:text-white">
                                    Client Dashboard
                                </h1>
                                <p className="text-blue-700 mt-1 dark:text-blue-200">
                                    Welcome back, <span className="font-semibold">{user?.name || user?.email || 'Client'}!</span> Your portal to explore products and manage orders.
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center">
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Quick Stats for Client */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <StatCard
                            Icon={Package}
                            title="Total Products Available"
                            value={dashboardStats.totalProducts}
                            isLoading={loadingData}
                            gradientFrom="from-blue-500"
                            gradientTo="to-cyan-500"
                        />
                        <StatCard
                            Icon={Tag}
                            title="Product Categories"
                            value={dashboardStats.totalCategories}
                            isLoading={loadingData}
                            gradientFrom="from-purple-500"
                            gradientTo="to-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Browse Products Card */}
                        <div className={`backdrop-blur-sm rounded-2xl shadow-xl p-6 border transition-colors duration-300
                            ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                        `}>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                                <Package className="w-5 h-5 text-blue-500 mr-2" /> Browse Products
                            </h3>
                            <p className="text-gray-700 text-sm dark:text-gray-300 mb-4">
                                Explore the full range of products available in our inventory. Find what you need quickly.
                            </p>
                            <Link to="/products" className="inline-flex items-center justify-center bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200 text-sm font-medium shadow-md">
                                View All Products
                            </Link>
                        </div>

                        {/* My Recent Orders Card */}
                        <div className={`backdrop-blur-sm rounded-2xl shadow-xl p-6 border transition-colors duration-300
                            ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                        `}>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                                <ShoppingCart className="w-5 h-5 text-green-500 mr-2" /> My Recent Orders
                            </h3>
                            {loadingData ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-600 animate-pulse">
                                            <div className="flex-1 space-y-1">
                                                <div className="h-4 bg-gray-300 dark:bg-gray-500 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 dark:bg-gray-500 rounded w-1/2"></div>
                                            </div>
                                            <div className="w-16 h-4 bg-gray-300 dark:bg-gray-500 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : dashboardStats.recentOrders.length === 0 ? (
                                <p className="text-center text-gray-600 dark:text-gray-300 py-4">You haven't placed any orders yet.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {dashboardStats.recentOrders.map(order => (
                                        <li key={order.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors
                                            ${theme === 'dark' ? 'bg-white bg-opacity-5' : 'bg-gray-50'}
                                            hover:bg-gray-100 dark:hover:bg-gray-600
                                        `}>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">{order.product} (x{order.quantity})</p>
                                                <p className="text-xs text-gray-500 dark:text-blue-300">Ordered on: {order.date}</p>
                                            </div>
                                            <span className={`text-xs font-semibold
                                                ${order.status === 'Shipped' ? 'text-blue-500' :
                                                  order.status === 'Delivered' ? 'text-green-500' :
                                                  'text-yellow-500'}
                                            `}>
                                                {order.status.toUpperCase()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors dark:text-blue-300 dark:hover:text-white">
                                View All Orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClientDashboard;
