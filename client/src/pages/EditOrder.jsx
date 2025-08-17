// client/src/pages/EditOrder.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { Edit, ArrowLeft, Save, ShoppingCart } from 'lucide-react';

function EditOrderPage() {
    const { id } = useParams(); // Get order ID from URL
    const navigate = useNavigate();
    const { token, loadingAuthState } = useAuth();
    const { showTimedMessage } = useNotification();

    const [clientName, setClientName] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [products, setProducts] = useState([]); // Products already in the order (read-only for simplicity)
    const [totalPrice, setTotalPrice] = useState(0);
    const [orderDate, setOrderDate] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true); // Start loading to fetch order data
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch single order for the edit form
    const fetchOrder = useCallback(async () => {
        if (!token || !id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await API.get(`/orders/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const orderData = response.data;
            setClientName(orderData.clientName);
            setClientAddress(orderData.clientAddress);
            setProducts(orderData.products || []);
            setTotalPrice(orderData.totalPrice || 0);
            setOrderDate(orderData.orderDate ? new Date(orderData.orderDate).toLocaleDateString() : '');
            setStatus(orderData.status || 'Pending');
        } catch (err) {
            console.error('Error fetching order:', err);
            setError(err.response?.data?.message || 'Failed to load order.');
            showTimedMessage(err.response?.data?.message || 'Failed to load order.', 5000, 'error');
            if (err.response?.status === 404 || err.response?.status === 403) {
                navigate('/orders'); // Redirect if order not found or unauthorized
            }
        } finally {
            setLoading(false);
        }
    }, [id, token, navigate, showTimedMessage]);

    useEffect(() => {
        if (!loadingAuthState) {
            fetchOrder();
        }
    }, [loadingAuthState, fetchOrder]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!token) {
            showTimedMessage('You must be logged in to edit an order.', 3000);
            return;
        }
        if (!clientName.trim() || !clientAddress.trim() || !status.trim()) {
            showTimedMessage('Please fill all required fields.', 3000);
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const updatedOrder = {
                clientName: clientName.trim(),
                clientAddress: clientAddress.trim(),
                status: status.trim(),
                // Products array is not directly editable through this form for simplicity
                // If you need to edit products, you'd need more complex logic here
            };
            await API.put(`/orders/${id}`, updatedOrder, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            showTimedMessage('Order updated successfully!', 3000, 'success');
            navigate('/orders'); // Redirect to order list
        } catch (err) {
            console.error('Error updating order:', err);
            setError(err.response?.data?.message || 'Failed to update order.');
            showTimedMessage(err.response?.data?.message || 'Failed to update order.', 5000, 'error');
        } finally {
            setIsSaving(false);
        }
    }, [id, clientName, clientAddress, status, token, navigate, showTimedMessage]);

    if (loadingAuthState || loading) {
        return (
            <div className="flex items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-300">
                <p className="text-indigo-600 dark:text-indigo-300">Loading order data...</p>
            </div>
        );
    }

    if (error && !clientName) { // Only show error if we failed to load data initially
        return (
            <div className="flex items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-300">
                <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:shadow-none transition-colors duration-300">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/orders')}
                    className="mr-3 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                    title="Back to Orders"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-3xl font-bold text-indigo-700 flex items-center dark:text-indigo-300">
                    <Edit className="w-8 h-8 mr-3 text-purple-500 dark:text-purple-300" />
                    Edit Order
                </h2>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 dark:bg-red-900 dark:text-red-200">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Client Name</label>
                        <input
                            type="text"
                            id="clientName"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="e.g., John Doe"
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Client Address</label>
                        <input
                            type="text"
                            id="clientAddress"
                            value={clientAddress}
                            onChange={(e) => setClientAddress(e.target.value)}
                            placeholder="e.g., 123 Main St, Anytown"
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Order Status */}
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Order Status</label>
                    <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Products in Order (Read-only display) */}
                <div className="p-4 border border-gray-300 rounded-lg dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Products in this Order</h3>
                    {products.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No products in this order.</p>
                    ) : (
                        <ul className="space-y-2">
                            {products.map((p, idx) => (
                                <li key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <span className="font-medium text-gray-800 dark:text-gray-100">{p.name} (x{p.quantity})</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">${(p.quantity * p.price).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="text-right text-xl font-bold text-gray-900 dark:text-white mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        Total: ${totalPrice.toFixed(2)}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSaving}
                    className="**w-fit** flex items-center justify-center bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-indigo-700 transition-all duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed **mx-auto**"
                >
                    {isSaving ? (
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <Save className="w-5 h-5 mr-2" />
                    )}
                    {isSaving ? 'Updating Order...' : 'Update Order'}
                </button>
            </form>
        </div>
    );
}

export default EditOrderPage;