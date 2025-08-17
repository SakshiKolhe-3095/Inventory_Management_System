import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNotification } from '../../components/Notification.jsx';
import API from '../../api/axios.js';
import { ShoppingCart, RefreshCw, Loader2, Eye, XCircle } from 'lucide-react';

// Mock Order Data (for development/testing purposes, with fully populated categories)
// This structure reflects EXACTLY what your backend /api/orders should ideally return
const mockOrders = [
    {
        _id: 'order001',
        clientName: 'Alice Smith',
        clientAddress: '123 Main St, Anytown',
        orderDate: '2025-07-10T10:00:00Z',
        totalPrice: 151.97,
        status: 'Delivered',
        products: [
            { name: 'Wireless Mouse', category: { _id: 'cat001', name: 'Electronics' }, quantity: 2, price: 25.99 },
            { name: 'Mechanical Keyboard', category: { _id: 'cat001', name: 'Electronics' }, quantity: 1, price: 99.99 },
        ],
    },
    {
        _id: 'order002',
        clientName: 'Bob Johnson',
        clientAddress: '456 Oak Ave, Somewhere',
        orderDate: '2025-07-12T14:30:00Z',
        totalPrice: 35.00,
        status: 'Pending',
        products: [
            { name: 'USB-C Hub', category: { _id: 'cat002', name: 'Accessories' }, quantity: 1, price: 35.00 },
        ],
    },
    {
        _id: 'order003',
        clientName: 'Charlie Brown',
        clientAddress: '789 Pine Ln, Nowhere',
        orderDate: '2025-07-15T09:15:00Z',
        totalPrice: 165.00,
        status: 'Processing',
        products: [
            { name: 'Sheet Metal Parts', category: { _id: 'cat004', name: 'Industrial Components' }, quantity: 71, price: 2.50 },
            { name: 'Electronics Parts', category: { _id: 'cat005', name: 'Electronic Components' }, quantity: 1, price: 34.99 },
        ],
    },
    {
        _id: 'order004',
        clientName: 'Diana Prince',
        clientAddress: '101 Themyscira Way',
        orderDate: '2025-07-17T11:00:00Z',
        totalPrice: 49.98,
        status: 'Pending',
        products: [
            { name: 'Sheet Metal Parts', category: { _id: 'cat004', name: 'Industrial Components' }, quantity: 2, price: 24.99 },
        ],
    },
];


function MyOrdersPage() {
    const { isAuthenticated, loading: authLoading, user, isClient, token } = useAuth();
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]); // Stores raw order data from API
    const [flattenedOrderItems, setFlattenedOrderItems] = useState([]); // Stores processed data for table display
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [errorOrders, setErrorOrders] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // State for View Order Modal
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [orderToView, setOrderToView] = useState(null);

    // Fetch orders from the API
    const fetchOrders = useCallback(async () => {
        console.log('MyOrdersPage: fetchOrders called.');
        setLoadingOrders(true);
        setErrorOrders(null);
        setIsRefreshing(true);

        if (!isAuthenticated || !token) {
            console.log('MyOrdersPage: Not authenticated or token missing. Using mock orders.');
            setLoadingOrders(false);
            setIsRefreshing(false);
            setOrders(mockOrders); // Fallback to mock orders
            showTimedMessage('Authentication required to fetch your orders. Using mock data.', 3000, 'error');
            return;
        }

        try {
            console.log('MyOrdersPage: Attempting to fetch orders from /api/orders...');
            const response = await API.get('/orders', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('MyOrdersPage: API response received:', response.data);

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setOrders(response.data);
                showTimedMessage('Your orders loaded successfully!', 2000, 'success');
            } else {
                console.warn('MyOrdersPage: API /orders returned no data or invalid format. Using mock orders.');
                showTimedMessage('No orders available. Using mock data.', 4000, 'info');
                setOrders(mockOrders); // Fallback to mock orders
            }
        } catch (err) {
            console.error('MyOrdersPage: Failed to fetch orders:', err);
            setErrorOrders(err.response?.data?.message || 'Failed to load your orders. Please try again.');
            showTimedMessage(err.response?.data?.message || 'Failed to load your orders.', 5000, 'error');
            setOrders(mockOrders); // Fallback on error
        } finally {
            setLoadingOrders(false);
            setIsRefreshing(false);
        }
    }, [isAuthenticated, token, showTimedMessage]);

    // Process orders into flattened items for table display
    useEffect(() => {
        if (orders.length > 0) {
            const items = [];
            orders.forEach(order => {
                order.products.forEach(productItem => {
                    items.push({
                        orderId: order._id,
                        orderDate: order.orderDate,
                        orderStatus: order.status,
                        totalPrice: order.totalPrice, // Keep original total for modal
                        clientName: order.clientName, // Keep client name for modal
                        clientAddress: order.clientAddress, // Keep client address for modal
                        productName: productItem.name,
                        productCategory: productItem.category?.name || 'N/A', // Using optional chaining and fallback
                        quantity: productItem.quantity,
                        itemPrice: productItem.price, // Price per unit of this product
                        itemSubtotal: productItem.quantity * productItem.price, // Subtotal for this product line item
                        originalOrder: order // Reference to the full order object for modal
                    });
                });
            });
            setFlattenedOrderItems(items);
        } else {
            setFlattenedOrderItems([]);
        }
    }, [orders]);

    // Open View Order Modal
    const openViewOrderModal = (order) => {
        setOrderToView(order); // Pass the original full order object to the modal
        setIsViewModalOpen(true);
    };

    // Close View Order Modal
    const closeViewOrderModal = () => {
        setIsViewModalOpen(false);
        setOrderToView(null);
    };

    // Initial fetch on component mount and when authentication state changes
    useEffect(() => {
        console.log('MyOrdersPage useEffect triggered. authLoading:', authLoading, 'isAuthenticated:', isAuthenticated, 'user role:', user?.role);
        if (!authLoading) {
            if (!isAuthenticated) {
                console.log('MyOrdersPage: User not authenticated. Redirecting to login.');
                navigate('/login');
            } else {
                // Fetch orders regardless of role, as the backend will filter for clients
                console.log('MyOrdersPage: User is authenticated. Calling fetchOrders.');
                fetchOrders();
            }
        }
    }, [isAuthenticated, authLoading, user, fetchOrders, navigate]);


    if (authLoading || loadingOrders) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="flex items-center space-x-3 text-lg font-medium text-blue-600 dark:text-blue-300">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading your orders...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <p className="text-red-600 dark:text-red-300">You need to be logged in to view your orders.</p>
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
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
                            <ShoppingCart className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-blue-800 dark:text-white">My Orders</h1>
                            <p className="text-blue-700 mt-1 dark:text-blue-200">View your past and current orders.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <button
                            onClick={fetchOrders}
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

                {errorOrders && (
                    <div className="p-4 mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center">
                        <p>{errorOrders}</p>
                    </div>
                )}

                {/* Orders Table */}
                <div className={`overflow-x-auto rounded-xl shadow-md border transition-colors duration-300
                    ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                `}>
                    {loadingOrders ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></Loader2>
                            <span className="ml-3 text-gray-600 dark:text-blue-200">Loading orders...</span>
                        </div>
                    ) : flattenedOrderItems.length === 0 ? (
                        <div className="p-8 text-center text-gray-600 dark:text-gray-300">
                            You have no orders yet.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tl-xl">
                                        Order ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Product Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Category
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Quantity
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Total Price
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Order Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tr-xl">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {flattenedOrderItems.map((item, index) => (
                                    <tr key={`${item.orderId}-${item.productName}-${index}`} className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors duration-150`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {item.orderId.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {item.productName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {item.productCategory}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            ${(item.itemSubtotal || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {new Date(item.orderDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${item.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                item.orderStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                item.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}
                                            `}>
                                                {item.orderStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openViewOrderModal(item.originalOrder)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 mr-3 transition-colors"
                                                title="View Order Details"
                                            >
                                                <Eye className="w-5 h-5 inline-block" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Order View Modal (reusing the OrderQuantityModal for display) */}
            {isViewModalOpen && orderToView && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl transform transition-all duration-300 scale-100 opacity-100">
                        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
                                <ShoppingCart className="w-7 h-7 text-blue-500 mr-2" />
                                Order Details
                            </h3>
                            <button
                                onClick={closeViewOrderModal}
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                title="Close"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-4 text-gray-700 dark:text-gray-300">
                            <p><strong>Order ID:</strong> {orderToView._id}</p>
                            <p><strong>Client Name:</strong> {orderToView.clientName}</p>
                            <p><strong>Client Address:</strong> {orderToView.clientAddress}</p>
                            <p><strong>Order Date:</strong> {new Date(orderToView.orderDate).toLocaleString()}</p>
                            <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                ${orderToView.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                orderToView.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                orderToView.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}
                            `}>{orderToView.status}</span></p>
                            <h4 className="text-lg font-semibold mt-6 mb-2 text-gray-900 dark:text-white">Ordered Products:</h4>
                            <ul className="list-disc list-inside space-y-2">
                                {orderToView.products.map((p, idx) => (
                                    <li key={idx} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                        <span>{p.name} (Category: {p.category?.name || 'N/A'}) x {p.quantity}</span>
                                        <span className="font-semibold">${(p.quantity * p.price).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xl font-bold text-right mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                Total Price: ${(orderToView.totalPrice || 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyOrdersPage;
