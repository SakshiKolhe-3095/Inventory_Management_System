// client/src/pages/OrderListPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
// ADD XCircle to the import list from lucide-react
import { ShoppingCart, PlusCircle, Edit, Trash2, Search, RefreshCw, Eye, XCircle, Loader2 } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal.jsx';

function OrderListPage() {
    const { isAuthenticated, loading: authLoading, token, user } = useAuth();
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [errorOrders, setErrorOrders] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // State for the Confirmation Modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [orderIdToDelete, setOrderIdToDelete] = useState(null);

    // State for View Order Modal (similar to Product/Category View)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [orderToView, setOrderToView] = useState(null);

    // Fetch orders from the API
    const fetchOrders = useCallback(async () => {
        setLoadingOrders(true);
        setErrorOrders(null);
        setIsRefreshing(true);

        if (!token) {
            setLoadingOrders(false);
            setIsRefreshing(false);
            showTimedMessage('Authentication required to fetch orders.', 3000, 'error');
            return;
        }

        try {
            const response = await API.get('/orders', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setOrders(response.data);
            showTimedMessage('Orders loaded successfully!', 2000, 'success');
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setErrorOrders(err.response?.data?.message || 'Failed to load orders. Please try again.');
            showTimedMessage(err.response?.data?.message || 'Failed to load orders.', 5000, 'error');
        } finally {
            setLoadingOrders(false);
            setIsRefreshing(false);
        }
    }, [token, showTimedMessage]);

    // Function to open the confirmation modal for deletion
    const openDeleteConfirmation = (orderId) => {
        setOrderIdToDelete(orderId);
        setIsConfirmModalOpen(true);
    };

    // Function to handle actual deletion after confirmation
    const confirmDeleteOrder = async () => {
        setIsConfirmModalOpen(false);
        if (!orderIdToDelete) return;

        showTimedMessage('Deleting order...', 1500, 'info');
        try {
            await API.delete(`/orders/${orderIdToDelete}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setOrders(prev => prev.filter(order => order._id !== orderIdToDelete));
            showTimedMessage('Order deleted successfully!', 3000, 'success');
        } catch (err) {
            console.error('Failed to delete order:', err);
            showTimedMessage(err.response?.data?.message || 'Failed to delete order. Please try again.', 5000, 'error');
        } finally {
            setOrderIdToDelete(null);
        }
    };

    // Function to cancel deletion
    const cancelDeleteOrder = () => {
        setIsConfirmModalOpen(false);
        setOrderIdToDelete(null);
        showTimedMessage('Order deletion cancelled.', 2000, 'info');
    };

    // Navigate to Add Order Page
    const navigateToAddOrder = () => {
        navigate('/orders/add');
    };

    // Navigate to Edit Order Page
    const navigateToEditOrder = (orderId) => {
        navigate(`/orders/edit/${orderId}`);
    };

    // Open View Order Modal
    const openViewOrderModal = (order) => {
        setOrderToView(order);
        setIsViewModalOpen(true);
    };

    // Close View Order Modal
    const closeViewOrderModal = () => {
        setIsViewModalOpen(false);
        setOrderToView(null);
    };

    // Initial fetch on component mount and when authentication state changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchOrders();
        } else if (!authLoading) { // Redirect only after authLoading is false
            navigate('/login');
        }
    }, [isAuthenticated, authLoading, fetchOrders, navigate]);

    // Filter orders based on search term (client name, product name, address)
    const filteredOrders = orders.filter(order => {
        const matchesClientName = order.clientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClientAddress = order.clientAddress.toLowerCase().includes(searchTerm.toLowerCase());
        // Ensure product.name exists before calling toLowerCase
        const matchesProductName = order.products.some(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesClientName || matchesClientAddress || matchesProductName;
    });

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="flex items-center space-x-3 text-lg font-medium text-blue-600 dark:text-blue-300">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading orders page...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <p className="text-red-600 dark:text-red-300">You need to be logged in to view orders.</p>
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
                            <h1 className="text-3xl font-bold text-blue-800 dark:text-white">Order Management</h1>
                            <p className="text-blue-700 mt-1 dark:text-blue-200">Track and manage client orders</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <button
                            onClick={navigateToAddOrder}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2"
                        >
                            <PlusCircle className="w-4 h-4" /> Add New Order
                        </button>
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

                {/* Search Bar */}
                <div className={`mb-6 p-4 rounded-xl shadow-md border transition-colors duration-300 flex flex-col sm:flex-row gap-4
                    ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                `}>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by client name, address, or product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'}
                            `}
                        />
                    </div>
                </div>

                {/* Orders Table */}
                <div className={`overflow-x-auto rounded-xl shadow-md border transition-colors duration-300
                    ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                `}>
                    {loadingOrders ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></Loader2>
                            <span className="ml-3 text-gray-600 dark:text-blue-200">Loading orders...</span>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-8 text-center text-gray-600 dark:text-gray-300">
                            No orders found matching your criteria.
                            <button onClick={navigateToAddOrder} className="ml-2 text-blue-500 hover:underline">Add one?</button>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tl-xl">
                                        S.No.
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Client Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Address
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Products (Name, Qty)
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
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tr-xl">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredOrders.map((order, index) => (
                                    <tr key={order._id} className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors duration-150`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {order.clientName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                            {order.clientAddress}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {order.products.map((p, pIdx) => (
                                                <div key={pIdx}>
                                                    {p.name} (Category: {p.category ? p.category.name : 'N/A'}) x {p.quantity} {/* Access p.category.name */}
                                                </div>
                                            ))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            ${(order.totalPrice || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {new Date(order.orderDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}
                                            `}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openViewOrderModal(order)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 mr-3 transition-colors"
                                                title="View Order Details"
                                            >
                                                <Eye className="w-5 h-5 inline-block" />
                                            </button>
                                            <button
                                                onClick={() => navigateToEditOrder(order._id)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-3 transition-colors"
                                                title="Edit Order"
                                            >
                                                <Edit className="w-5 h-5 inline-block" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteConfirmation(order._id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                                                title="Delete Order"
                                            >
                                                <Trash2 className="w-5 h-5 inline-block" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Confirmation Modal for Deletion */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={cancelDeleteOrder}
                onConfirm={confirmDeleteOrder}
                message="Are you sure you want to delete this order? This action cannot be undone and will revert product stock."
                title="Confirm Order Deletion"
            />

            {/* Order View Modal (reusing AddEditProductModal pattern for simplicity, but will be a read-only view) */}
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
                                <XCircle className="w-6 h-6" /> {/* XCircle is now imported */}
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
                                        {/* Access p.product.name and p.product.category.name if populated */}
                                        <span>
                                            {p.product ? p.product.name : p.name} (Category: {p.product?.category?.name || p.category || 'N/A'}) x {p.quantity}
                                        </span>
                                        <span className="font-semibold">${(p.quantity * (p.product ? p.product.price : p.price || 0)).toFixed(2)}</span>
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

export default OrderListPage;
