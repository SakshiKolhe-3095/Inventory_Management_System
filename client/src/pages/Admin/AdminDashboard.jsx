// client/src/pages/Admin/AdminDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNotification } from '../../components/Notification.jsx';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Package, Users, Truck, ClipboardList, AlertTriangle, Layers, PlusCircle,
    TrendingUp, TrendingDown, DollarSign, Activity, Calendar, Bell, Search, RefreshCw, Settings,
    BarChart3, ShoppingCart, Download, CircleDotDashed, MinusCircle, Tag // Added Tag icon for Categories
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RechartsPieChart, Pie, Cell, Legend // Added Legend for PieChart
} from 'recharts';
import API from '../../api/axios.js'; // Ensure this path is correct for your Axios instance

// Import the two distinct Low Stock components
import LowStockCountCard from '../../components/LowStockCountCard.jsx'; // Your component for the count summary
import LowStockProductsListCard from '../../components/LowStockProductsListCard.jsx'; // The component to display product lists

/**
 * @typedef {object} Product
 * @property {string} _id
 * @property {string} name
 * @property {string} sku
 * @property {number} stock
 * @property {number} price
 * @property {object} category - Assuming category is an object with a name property
 * @property {string} category.name
 * @property {number} [lowStockThreshold]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {object} Category
 * @property {string} _id
 * @property {string} name
 */

/**
 * @typedef {object} Order
 * @property {string} _id
 * @property {number} quantity
 * @property {string} status
 */

/**
 * @typedef {object} Supplier
 * @property {string} _id
 * @property {boolean} isActive // IMPORTANT: Ensure your backend Supplier model has this boolean field
 */

/**
 * @typedef {object} StatData
 * @property {number} totalProducts
 * @property {number} totalStock
 * @property {number} ordersToday
 * @property {number} revenueToday
 * @property {number} lowStockCount
 * @property {number} outOfStockCount
 * @property {number} totalValue
 * @property {number} monthlyGrowth
 *
 * @property {number} activeSuppliers
 * @property {number} pendingOrders
 *
 * @property {number} totalUsers
 */

/**
 * @typedef {object} InventoryTrendData
 * @property {string} month
 * @property {number} stock
 * @property {number} sales
 * @property {number} value
 */

/**
 * @typedef {object} CategoryDistributionData
 * @property {string} name
 * @property {number} value
 * @property {string} color
 */

/**
 * @typedef {object} RecentActivity
 * @property {string} id // Changed to string for potential backend IDs
 * @property {string} type // e.g., 'new_order', 'product_update', 'user_registered', 'stock_alert'
 * @property {string} message
 * @property {string} time // A human-readable time string, or a timestamp to format on frontend
 * @property {React.ElementType} icon // Lucide React icon component
 * @property {string} color // Tailwind CSS color class
 */

/**
 * @typedef {object} TopProduct
 * @property {string} id
 * @property {string} name
 * @property {number} sales
 * @property {'up'|'down'} trend
 * @property {string} change
 */

/**
 * @typedef {object} DashboardState
 * @property {StatData} stats
 * @property {InventoryTrendData[]} inventoryTrends
 * @property {CategoryDistributionData[]} categoryDistribution
 * @property {RecentActivity[]} recentActivities
 * @property {TopProduct[]} topProducts
 * @property {object[]} outOfStockProducts
 * @property {object[]} lowStockProducts
 */


// --- Mock Data (DEFINED AT TOP LEVEL) ---
const mockInventoryData = [
    { month: 'Jan', stock: 2400, sales: 2000, value: 15000 },
    { month: 'Feb', stock: 2100, sales: 2200, value: 16500 },
    { month: 'Mar', stock: 2800, sales: 1800, value: 18000 },
    { month: 'Apr', stock: 2600, sales: 2400, value: 17200 },
    { month: 'May', stock: 3200, sales: 2600, value: 19800 },
    { month: 'Jun', stock: 2900, sales: 2800, value: 21500 }
];

const defaultMockCategoryData = [
    { name: 'Electronics', value: 45, color: '#3b82f6' },
    { name: 'Clothing', value: 25, color: '#06b6d4' },
    { name: 'Books', value: 15, color: '#8b5cf6' },
    { name: 'Home & Garden', value: 10, color: '#10b981' },
    { name: 'Sports', value: 5, color: '#f59e0b' }
];

const defaultMockTopProducts = [
    { id: 'mock-tp-1', name: 'Mock Laptop Pro', sales: 250, trend: 'up', change: '+8%' },
    { id: 'mock-tp-2', name: 'Mock Smartwatch X', sales: 180, trend: 'up', change: '+5%' },
    { id: 'mock-tp-3', name: 'Mock Ergonomic Keyboard', sales: 120, trend: 'down', change: '-2%' },
    { id: 'mock-tp-4', name: 'Mock Wireless Earbuds', sales: 90, trend: 'up', change: '+3%' },
    { id: 'mock-tp-5', name: 'Mock External SSD', sales: 70, trend: 'down', change: '-1%' },
];

// Base mock data for low/out of stock if no real product data
const baseOutOfStockProducts = [
    { id: 'mock-oos-1', name: 'Mock Wireless Headphones', sku: 'MWH-001', lastOrder: '2023-05-10' },
    { id: 'mock-oos-2', name: 'Mock Gaming Mouse Pad', sku: 'MGMP-005', lastOrder: '2023-06-01' },
];

const baseLowStockProducts = [
    { id: 'mock-ls-1', name: 'Mock USB-C Hub', sku: 'MUCH-010', stock: 5, threshold: 10 },
    { id: 'mock-ls-2', name: 'Mock Portable SSD 1TB', sku: 'MSSD-002', stock: 8, threshold: 10 },
];

const initialStats = {
    totalProducts: 0,
    totalStock: 0,
    ordersToday: 0,
    revenueToday: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0,
    monthlyGrowth: 0,
    activeSuppliers: 0,
    pendingOrders: 0,
    totalUsers: 0
};

function AdminDashboardPage() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    /** @type {[DashboardState, React.Dispatch<React.SetStateAction<DashboardState>>]} */
    const [dashboardData, setDashboardData] = useState({
        stats: initialStats,
        inventoryTrends: mockInventoryData,
        categoryDistribution: defaultMockCategoryData,
        recentActivities: [], // Initialize as empty, will be fetched from backend
        topProducts: defaultMockTopProducts, // Use default mock for initial render, will be updated
        outOfStockProducts: [],
        lowStockProducts: [],
    });
    const [loadingActivities, setLoadingActivities] = useState(true);
    const [errorActivities, setErrorActivities] = useState(null);
    const [showAllActivities, setShowAllActivities] = useState(false); // New state for "View All"

    const [loadingData, setLoadingData] = useState(true); // For main stats, charts, stock lists
    const [errorData, setErrorData] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, message: '5 items need restock', type: 'warning', read: false },
        { id: 2, message: 'Monthly report ready', type: 'info', read: false },
        { id: 3, message: 'New order from premium customer', type: 'success', read: true }
    ]);

    // Function to fetch all main dashboard data (stats, charts, stock lists)
    const fetchMainDashboardData = useCallback(async () => {
        setLoadingData(true);
        setErrorData(null);

        try {
            const [
                productsCountResponse,
                totalStockResponse,
                ordersTodayResponse,
                revenueTodayResponse,
                allProductsResponse,
                allCategoriesResponse,
                allSuppliersResponse,
                pendingOrdersResponse,
                totalUsersResponse
            ] = await Promise.all([
                API.get('/products/count'),
                API.get('/products/total-stock'),
                API.get('/orders/today-count'),
                API.get('/orders/today-revenue'),
                API.get('/products/all'),
                API.get('/categories/all'),
                API.get('/suppliers/all'),
                API.get('/orders/pending-count'),
                API.get('/users/count')
            ]);

            let totalProductsCount = productsCountResponse.data?.count || 0;
            let totalStock = totalStockResponse.data?.totalStock || 0;
            let ordersToday = ordersTodayResponse.data?.ordersToday || 0;
            let revenueToday = parseFloat(revenueTodayResponse.data?.revenueToday || 0);
            /** @type {Product[]} */
            let allProducts = allProductsResponse.data || [];
            /** @type {Category[]} */
            let allCategories = allCategoriesResponse.data || [];
            /** @type {Supplier[]} */
            let allSuppliers = allSuppliersResponse.data || [];
            let pendingOrdersCount = pendingOrdersResponse.data?.pendingOrders || 0;
            let totalUsersCount = totalUsersResponse.data?.count || 0;

            if (!Array.isArray(allProducts)) {
                console.error('API /products/all did not return an array. Received:', allProducts);
                allProducts = [];
            }
            if (!Array.isArray(allCategories)) {
                console.error('API /categories/all did not return an array. Received:', allCategories);
                allCategories = [];
            }
            if (!Array.isArray(allSuppliers)) {
                console.error('API /suppliers/all did not return an array. Received:', allSuppliers);
                allSuppliers = [];
            }

            const categoryProductCounts = {};
            allProducts.forEach(p => {
                if (p.category && p.category.name) {
                    categoryProductCounts[p.category.name] = (categoryProductCounts[p.category.name] || 0) + 1;
                }
            });

            const predefinedColors = [
                '#4CAF50', '#2196F3', '#FFC107', '#F44336', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63',
                '#8BC34A', '#03A9F4', '#FFEB3B', '#795548', '#607D8B', '#673AB7', '#CDDC39', '#FF5722',
                '#795548', '#9E9E9E', '#607D8B', '#3F51B5'
            ];

            const categoryDistributionData = allCategories.map((cat, index) => {
                const count = categoryProductCounts[cat.name] || 0;
                const color = predefinedColors[index % predefinedColors.length];

                return {
                    name: cat.name,
                    value: count,
                    color: color
                };
            });

            const totalProductsForCategories = categoryDistributionData.reduce((sum, entry) => sum + entry.value, 0);
            const finalCategoryDistribution = categoryDistributionData.map(entry => ({
                ...entry,
                value: parseFloat((totalProductsForCategories > 0 ? (entry.value / totalProductsForCategories * 100) : 0).toFixed(1))
            })).sort((a,b) => b.value - a.value);

            const effectiveCategoryDistribution = finalCategoryDistribution.length > 0 && totalProductsForCategories > 0 ? finalCategoryDistribution : defaultMockCategoryData;

            const topProductsData = allProducts.length > 0
                ? allProducts.sort((a, b) => b.stock - a.stock).slice(0, 5).map((p, index) => ({
                    id: p._id,
                    name: p.name,
                    sales: Math.floor(Math.random() * 300) + 50,
                    trend: index % 2 === 0 ? 'up' : 'down',
                    change: `+${Math.floor(Math.random() * 10)}%`
                }))
                : defaultMockTopProducts;

            const outOfStockProducts = allProducts.filter(p => p.stock === 0).map(p => ({
                id: p._id,
                name: p.name,
                sku: p.sku,
                lastOrder: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : 'N/A'
            }));

            const lowStockProducts = allProducts.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 10)).map(p => ({
                id: p._id,
                name: p.name,
                sku: p.sku,
                stock: p.stock,
                threshold: p.lowStockThreshold || 10
            }));

            // Correctly filter active suppliers by the 'isActive' boolean field
            const activeSuppliersCount = allSuppliers.length;

            const currentLowStockCount = lowStockProducts.length;
            const currentOutOfStockCount = outOfStockProducts.length;
            const currentTotalValue = allProducts.reduce((acc, p) => acc + (p.stock * p.price), 0);
            const currentMonthlyGrowth = (10 + Math.random() * 5).toFixed(1);

            const updatedStats = {
                totalProducts: totalProductsCount,
                totalStock: totalStock,
                ordersToday: ordersToday,
                revenueToday: parseFloat(revenueToday),
                lowStockCount: currentLowStockCount,
                outOfStockCount: currentOutOfStockCount,
                totalValue: currentTotalValue,
                monthlyGrowth: parseFloat(currentMonthlyGrowth),
                activeSuppliers: activeSuppliersCount,
                pendingOrders: pendingOrdersResponse.data?.pendingOrders || 0, // Use actual pending orders count
                totalUsers: totalUsersResponse.data?.count || 0 // Use actual total users count
            };

            setDashboardData(prev => ({
                ...prev,
                stats: updatedStats,
                inventoryTrends: mockInventoryData, // Still mocked
                categoryDistribution: effectiveCategoryDistribution,
                topProducts: topProductsData,
                outOfStockProducts: outOfStockProducts.length > 0 ? outOfStockProducts : baseOutOfStockProducts,
                lowStockProducts: lowStockProducts.length > 0 ? lowStockProducts : baseLowStockProducts,
            }));

            showTimedMessage('Main dashboard data loaded successfully!', 2000, 'success');
        } catch (err) {
            console.error('Main Dashboard Data Fetch Error (Caught in Frontend):', err);
            setErrorData(`Failed to load main dashboard data: ${err.message}. Please check your backend server and network connection.`);
            showTimedMessage('Failed to load main dashboard data. See console for details.', 5000, 'error');
            setDashboardData(prev => ({
                ...prev,
                stats: initialStats,
                inventoryTrends: mockInventoryData,
                categoryDistribution: defaultMockCategoryData,
                topProducts: defaultMockTopProducts, // Ensure this is used as fallback
                outOfStockProducts: baseOutOfStockProducts,
                lowStockProducts: baseLowStockProducts,
            }));
        } finally {
            setLoadingData(false);
        }
    }, [showTimedMessage]);

    // Function to fetch recent activities
    const fetchRecentActivities = useCallback(async () => {
        setLoadingActivities(true);
        setErrorActivities(null);
        try {
            // Updated API endpoint to include '/reports' prefix
            const response = await API.get('/reports/recent-activities');
            /** @type {RecentActivity[]} */
            const fetchedActivities = response.data.map(activity => {
                // Map string icon names from backend to Lucide React components
                const IconComponent = {
                    ShoppingCart: ShoppingCart,
                    Package: Package,
                    Users: Users,
                    AlertTriangle: AlertTriangle,
                    Layers: Layers,
                    Truck: Truck,
                    PlusCircle: PlusCircle,
                    // Add more mappings as needed for other activity types sent from backend
                }[activity.icon] || Activity; // Default to Activity icon if not found

                return {
                    ...activity,
                    icon: IconComponent
                };
            });
            setDashboardData(prev => ({ ...prev, recentActivities: fetchedActivities }));
            showTimedMessage('Recent activities loaded!', 1500, 'info');
        } catch (err) {
            console.error('Failed to fetch recent activities:', err);
            setErrorActivities(`Failed to load recent activities: ${err.message}. Ensure backend endpoint /api/reports/recent-activities is correctly implemented and running.`);
            showTimedMessage('Failed to load recent activities. See console for details.', 5000, 'error');
            setDashboardData(prev => ({ ...prev, recentActivities: [] })); // Clear activities on error
        } finally {
            setLoadingActivities(false);
        }
    }, [showTimedMessage]);

    // Combined refresh function
    const handleFullRefresh = useCallback(() => {
        setIsRefreshing(true);
        // Run both fetches concurrently
        Promise.all([
            fetchMainDashboardData(),
            fetchRecentActivities()
        ]).finally(() => {
            setIsRefreshing(false);
        });
    }, [fetchMainDashboardData, fetchRecentActivities]);


    useEffect(() => {
        if (!authLoading && isAuthenticated && user?.role === 'admin') {
            handleFullRefresh(); // Initial fetch of all data
        }
    }, [isAuthenticated, user, authLoading, handleFullRefresh]);

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
            navigate('/login');
            showTimedMessage('Access denied. You must be logged in as an admin to view this page.', 3000, 'error');
        }
    }, [isAuthenticated, authLoading, user, navigate, showTimedMessage]);

    const StatCard = ({ Icon, title, value, subtitle, gradientFrom, gradientTo, trend, trendValue, isLoading }) => (
        <div className="bg-white bg-opacity-90 dark:bg-gray-700 dark:bg-opacity-80 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-600 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-blue-200">{title}</p>
                        {isLoading ? (
                            <div className="h-7 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                        ) : (
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
                        )}
                        {subtitle && <p className="text-xs text-gray-500 dark:text-blue-300">{subtitle}</p>}
                    </div>
                </div>
                {trend && !isLoading && (
                    <div className={`flex items-center space-x-1 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="text-sm font-semibold">{trendValue}</span>
                    </div>
                )}
            </div>
        </div>
    );

    const ActionButton = ({ to, children, gradientFrom = 'from-blue-600', gradientTo = 'to-cyan-600', icon: Icon }) => (
        <Link to={to} className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2`}>
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </Link>
    );

    if (authLoading || loadingData) { // loadingData now covers main stats, charts, stock lists
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-lg font-medium text-blue-600 dark:text-blue-300">Loading dashboard data...</span>
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

    // Determine which activities to show
    const activitiesToShow = showAllActivities ? dashboardData.recentActivities : dashboardData.recentActivities.slice(0, 5); // Show 5 initially

    return (
        <div className={`relative p-6 rounded-xl shadow-lg transition-colors duration-300 mt-6
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
                                    Inventory & Stock Dashboard
                                </h1>
                                <p className="text-blue-700 mt-1 dark:text-blue-200">
                                    Welcome back, <span className="font-semibold">{user?.name || user?.email}!</span> Get a clear overview of your product inventory.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                            {/* Notifications Icon and Count */}
                            <div className="relative">
                                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-200 hover:text-blue-800 dark:hover:text-white cursor-pointer transition-colors" />
                                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {notifications.filter(n => !n.read).length}
                                </span>
                            </div>

                            {/* Refresh Button with spinner */}
                            <button
                                onClick={handleFullRefresh} // Use the combined refresh function
                                disabled={isRefreshing}
                                className={`p-2 rounded-xl border transition-all duration-200 ${isRefreshing ? 'animate-spin' : ''}
                                    ${theme === 'dark' ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}
                                    disabled:opacity-60 disabled:cursor-not-allowed
                                `}
                            >
                                <RefreshCw className="w-5 h-5 text-gray-600 dark:text-blue-200" />
                            </button>

                            {/* Search Input */}
                            <div className={`flex items-center gap-2 rounded-xl px-4 py-2 border transition-colors duration-300
                                ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'}
                            `}>
                                <Search className="w-4 h-4 text-gray-600 dark:text-blue-200" />
                                <input
                                    type="text"
                                    placeholder="Search inventory..."
                                    className="bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-500 dark:text-white dark:placeholder-blue-300 w-48"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error Message Display */}
                    {errorData && (
                        <div className="p-4 mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center">
                            <p>{errorData}</p>
                        </div>
                    )}

                    {/* Key Metrics Section (Summary Cards) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            Icon={Package}
                            title="Total Products"
                            value={dashboardData.stats.totalProducts.toLocaleString()}
                            gradientFrom="from-blue-500"
                            gradientTo="to-cyan-500"
                            trend="up"
                            trendValue="+5.2%" // This trend is still mocked
                            isLoading={loadingData}
                        />
                        <StatCard
                            Icon={Layers} // Icon for Total Stock
                            title="Total Stock"
                            value={dashboardData.stats.totalStock.toLocaleString()}
                            gradientFrom="from-purple-500"
                            gradientTo="to-indigo-500"
                            trend="up"
                            trendValue="+3.1%"
                            isLoading={loadingData}
                        />
                        <StatCard
                            Icon={CircleDotDashed} // Icon for Orders Today
                            title="Orders Today"
                            value={dashboardData.stats.ordersToday.toLocaleString()}
                            gradientFrom="from-orange-500"
                            gradientTo="to-yellow-500"
                            subtitle="New orders received"
                            isLoading={loadingData}
                        />
                        <StatCard
                            Icon={DollarSign}
                            title="Revenue Today"
                            value={`$${dashboardData.stats.revenueToday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            gradientFrom="from-green-500"
                            gradientTo="to-emerald-500"
                            trend="up"
                            trendValue="+12.5%"
                            isLoading={loadingData}
                        />
                        <StatCard
                            Icon={MinusCircle}
                            title="Out of Stock Items"
                            value={dashboardData.stats.outOfStockCount.toLocaleString()}
                            gradientFrom="from-red-500"
                            gradientTo="to-rose-500"
                            subtitle="Products currently unavailable"
                            isLoading={loadingData}
                        />
                        <StatCard
                            Icon={Activity}
                            title="Total Inventory Value"
                            value={`$${dashboardData.stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            gradientFrom="from-pink-500"
                            gradientTo="to-fuchsia-500"
                            subtitle="Estimated total value of current stock"
                            isLoading={loadingData}
                        />
                        <StatCard
                            Icon={TrendingUp}
                            title="Monthly Growth"
                            value={`${dashboardData.stats.monthlyGrowth}%`}
                            gradientFrom="from-teal-500"
                            gradientTo="to-lime-500"
                            trend="up"
                            trendValue="+10.0%" // Still mock
                            isLoading={loadingData}
                        />
                         <StatCard
                            Icon={Truck}
                            title="Active Suppliers"
                            value={dashboardData.stats.activeSuppliers.toLocaleString()}
                            gradientFrom="from-indigo-500"
                            gradientTo="to-purple-500"
                            subtitle="Partners providing products"
                            isLoading={loadingData}
                        />
                        <StatCard
                            Icon={ClipboardList}
                            title="Pending Orders"
                            value={dashboardData.stats.pendingOrders.toLocaleString()}
                            gradientFrom="from-gray-500"
                            gradientTo="to-slate-500"
                            subtitle="Awaiting fulfillment"
                            isLoading={loadingData}
                        />
                        <StatCard
                            Icon={Users}
                            title="Total Users"
                            value={dashboardData.stats.totalUsers.toLocaleString()}
                            gradientFrom="from-cyan-500"
                            gradientTo="to-blue-500"
                            subtitle="Registered accounts"
                            isLoading={loadingData}
                        />
                        {/* Low Stock Alerts Card - Moved to the end of summary cards for better visual flow */}
                        {user?.role === 'admin' && (
                            <div className="lg:col-span-1"> {/* Ensure it takes 1 column, not full width */}
                                <LowStockCountCard /> {/* LowStockCountCard handles its own loading state */}
                            </div>
                        )}
                    </div>

                    {/* Charts and Analytics Section */}
                    {/* Changed lg:grid-cols-3 to lg:grid-cols-2 for more balanced chart widths */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Inventory Trends Line Chart */}
                        {/* Removed lg:col-span-2 so it now occupies 1 column, same as pie chart */}
                        <div className={`backdrop-blur-sm rounded-2xl shadow-xl p-6 border transition-colors duration-300
                            ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                        `}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Inventory Trends</h3>
                                <div className="flex items-center gap-2">
                                    <select className={`text-sm rounded-lg px-3 py-1 border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300
                                        ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-800'}
                                    `}>
                                        <option className="text-gray-800 dark:text-gray-200">Last 6 months</option>
                                        <option className="text-gray-800 dark:text-gray-200">Last 12 months</option>
                                        <option className="text-gray-800 dark:text-gray-200">This year</option>
                                    </select>
                                </div>
                            </div>

                            {loadingData ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="ml-3 text-gray-600 dark:text-blue-200">Loading chart...</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={dashboardData.inventoryTrends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} />
                                        <XAxis dataKey="month" stroke={theme === 'dark' ? '#cbd5e1' : '#6b7280'} />
                                        <YAxis stroke={theme === 'dark' ? '#cbd5e1' : '#6b7280'} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255,255,255,0.9)',
                                                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                color: theme === 'dark' ? 'white' : '#374151'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="stock"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#06b6d4"
                                            strokeWidth={3}
                                            dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Category Distribution Pie Chart */}
                        <div className={`backdrop-blur-sm rounded-2xl shadow-xl p-6 border transition-colors duration-300
                            ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                        `}>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                                <Tag className="w-5 h-5 text-blue-500 mr-2" /> Category Distribution
                            </h3>
                            {loadingData ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="ml-3 text-gray-600 dark:text-blue-200">Loading chart...</span>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsPieChart margin={{ top: 0, right: 0, bottom: 0, left: 8 }}>
                                        <Pie
                                            data={dashboardData.categoryDistribution}
                                            cx="35%" // Center X of the pie
                                            cy="50%"
                                            outerRadius={90}
                                            innerRadius={60}
                                            dataKey="value"
                                        >
                                            {dashboardData.categoryDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255,255,255,0.9)',
                                                border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                color: theme === 'dark' ? 'white' : '#374151'
                                            }}
                                            formatter={(value, name, props) => [`${value}%`, name]}
                                        />
                                        {/* Legend positioned vertically on the right, within the chart's bounds */}
                                        <Legend
                                            align="right"
                                            verticalAlign="middle"
                                            layout="vertical"
                                            wrapperStyle={{
                                                width: '60%', // Allocate width for the legend
                                                overflowY: 'auto', // Enable vertical scrolling if too many items
                                                maxHeight: '100%', // Limit height to container
                                                fontSize: '1.0rem',
                                                color: theme === 'dark' ? '#cbd5e1' : '#6b7280',
                                                // Position the legend relative to the chart area
                                                // This ensures it stays within the ResponsiveContainer's bounds
                                                left: '38%', // Start the legend from 40% of the chart width
                                                top: '45%',
                                                transform: 'translateY(-50%)',
                                                position: 'absolute' // Important for positioning within ResponsiveContainer
                                            }}
                                            formatter={(value, entry) => (
                                                <span style={{ color: entry.color }}>
                                                    {value} ({entry.payload.value}%)
                                                </span>
                                            )}
                                        />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Alerts and Top Products Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Low Stock & Out of Stock Products Lists (using LowStockProductsListCard) */}
                        <div className={`backdrop-blur-sm rounded-2xl shadow-xl p-6 border transition-colors duration-300
                            ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                        `}>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" /> Stock Alerts Details
                            </h3>
                            {loadingData ? (
                                <div className="flex items-center justify-center h-48">
                                    <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="ml-3 text-gray-600 dark:text-yellow-200">Loading alerts...</span>
                                </div>
                            ) : (
                                <>
                                    <LowStockProductsListCard
                                        products={dashboardData.lowStockProducts}
                                        type="low"
                                        title="Low Stock Products"
                                        icon={AlertTriangle}
                                        iconColor="text-yellow-500"
                                        emptyMessage="No products currently low on stock. Great!"
                                    />
                                    <div className="mt-6">
                                        <LowStockProductsListCard
                                            products={dashboardData.outOfStockProducts}
                                            type="out"
                                            title="Out of Stock Products"
                                            icon={MinusCircle}
                                            iconColor="text-red-500"
                                            emptyMessage="No products currently out of stock. Excellent!"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Top Products */}
                        <div className={`backdrop-blur-sm rounded-2xl shadow-xl p-6 border transition-colors duration-300
                            ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                        `}>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                                <BarChart3 className="w-5 h-5 text-blue-500 mr-2" /> Top Products (by Stock)
                            </h3>
                            {loadingData ? (
                                <div className="flex items-center justify-center h-48">
                                    <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="ml-3 text-gray-600 dark:text-blue-200">Loading top products...</span>
                                </div>
                            ) : (
                                <ul className="space-y-4">
                                    {dashboardData.topProducts.length > 0 ? (
                                        dashboardData.topProducts.map(product => (
                                            <li key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 shadow-sm">
                                                <div className="flex items-center">
                                                    <span className={`w-2 h-2 rounded-full mr-3 ${product.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    <span className="text-gray-800 dark:text-white font-medium">{product.name}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-gray-600 dark:text-gray-300 text-sm">Sales: {product.sales}</span>
                                                    <span className={`text-sm font-semibold ${product.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                                        {product.trend === 'up' ? <TrendingUp className="w-4 h-4 inline-block" /> : <TrendingDown className="w-4 h-4 inline-block" />} {product.change}
                                                    </span>
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <p className="text-gray-600 dark:text-gray-400 text-center py-4">No top products to display yet. Add more products!</p>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Recent Activities Section */}
                    <div className={`backdrop-blur-sm rounded-2xl shadow-xl p-6 border transition-colors duration-300
                        ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                    `}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                                <Activity className="w-5 h-5 text-purple-500 mr-2" /> Recent Activities
                            </h3>
                            {dashboardData.recentActivities.length > 5 && ( // Only show "View All" if there are more than 5 activities
                                <button
                                    onClick={() => setShowAllActivities(!showAllActivities)}
                                    className="text-blue-600 dark:text-blue-300 hover:underline text-sm font-medium"
                                >
                                    {showAllActivities ? 'Show Less' : 'View All'}
                                </button>
                            )}
                        </div>
                        {loadingActivities ? ( // Use specific loading state for activities
                            <div className="flex items-center justify-center h-48">
                                <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="ml-3 text-gray-600 dark:text-purple-200">Loading activities...</span>
                            </div>
                        ) : errorActivities ? ( // Show error if activities failed to load
                            <p className="text-red-500 dark:text-red-300 text-center py-4">{errorActivities}</p>
                        ) : (
                            <ul className="space-y-4">
                                {activitiesToShow.length > 0 ? (
                                    activitiesToShow.map(activity => (
                                        <li key={activity.id} className="flex items-start p-3 rounded-lg bg-gray-50 dark:bg-gray-700 shadow-sm">
                                            {activity.icon && <activity.icon className={`w-5 h-5 mr-3 ${activity.color}`} />}
                                            <div>
                                                <p className="text-sm text-gray-800 dark:text-white">{activity.message}</p>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <p className="text-gray-600 dark:text-gray-400 text-center py-4">No recent activities to display. (Ensure backend endpoint `/api/reports/recent-activities` is correctly implemented and returning data)</p>
                                )}
                            </ul>
                        )}
                    </div>

                    {/* Quick Actions Section */}
                    <div className="mt-8 text-center">
                        <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-6">Quick Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <ActionButton to="/products/add" icon={PlusCircle} gradientFrom="from-green-500" gradientTo="to-emerald-500">
                                Add New Product
                            </ActionButton>
                            <ActionButton to="/products" icon={Package} gradientFrom="from-blue-500" gradientTo="to-cyan-500">
                                View All Products
                            </ActionButton>
                            <ActionButton to="/orders" icon={ClipboardList} gradientFrom="from-orange-500" gradientTo="to-yellow-500">
                                Manage Orders
                            </ActionButton>
                            <ActionButton to="/users" icon={Users} gradientFrom="from-purple-500" gradientTo="to-indigo-500">
                                Manage Users
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </div>
    );
}

export default AdminDashboardPage;
