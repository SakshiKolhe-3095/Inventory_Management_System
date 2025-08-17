// client/src/pages/AddOrder.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { PlusCircle, ArrowLeft, Trash2 } from 'lucide-react';

function AddOrderPage() {
    const { token, loadingAuthState } = useAuth();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [clientName, setClientName] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]); // Array of { productId, quantity }
    const [availableProducts, setAvailableProducts] = useState([]); // All products fetched from API
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all available products for selection
    const fetchAvailableProducts = useCallback(async () => {
        if (!token) return;
        try {
            const response = await API.get('/products', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setAvailableProducts(response.data);
        } catch (err) {
            console.error('Error fetching available products:', err);
            showTimedMessage('Failed to load products for order creation.', 5000, 'error');
        }
    }, [token, showTimedMessage]);

    useEffect(() => {
        if (!loadingAuthState) {
            fetchAvailableProducts();
        }
    }, [loadingAuthState, fetchAvailableProducts]);

    const handleAddProductToOrder = (productId) => {
        const productToAdd = availableProducts.find(p => p._id === productId);
        if (productToAdd && productToAdd.stock > 0) {
            // Check if product already exists in selectedProducts
            const existingProductIndex = selectedProducts.findIndex(item => item.productId === productId);

            if (existingProductIndex > -1) {
                // If exists, increment quantity if stock allows
                const updatedSelectedProducts = [...selectedProducts];
                if (updatedSelectedProducts[existingProductIndex].quantity < productToAdd.stock) {
                    updatedSelectedProducts[existingProductIndex].quantity += 1;
                    setSelectedProducts(updatedSelectedProducts);
                } else {
                    showTimedMessage(`Max stock reached for ${productToAdd.name}.`, 3000, 'warning');
                }
            } else {
                // Add new product with quantity 1
                setSelectedProducts(prev => [...prev, { productId: productToAdd._id, quantity: 1 }]);
            }
        } else if (productToAdd && productToAdd.stock === 0) {
            showTimedMessage(`${productToAdd.name} is out of stock.`, 3000, 'error');
        } else {
            showTimedMessage('Product not found.', 3000, 'error');
        }
    };

    const handleUpdateProductQuantity = (productId, newQuantity) => {
        setSelectedProducts(prev =>
            prev.map(item => {
                if (item.productId === productId) {
                    const productInStock = availableProducts.find(p => p._id === productId);
                    const maxQuantity = productInStock ? productInStock.stock : 0;
                    const quantity = Math.max(1, Math.min(newQuantity, maxQuantity)); // Ensure quantity is min 1 and not more than stock
                    return { ...item, quantity };
                }
                return item;
            })
        );
    };

    const handleRemoveProductFromOrder = (productId) => {
        setSelectedProducts(prev => prev.filter(item => item.productId !== productId));
    };

    const calculateTotalPrice = () => {
        return selectedProducts.reduce((total, item) => {
            const product = availableProducts.find(p => p._id === item.productId);
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    };

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!token) {
            showTimedMessage('You must be logged in to create an order.', 3000);
            return;
        }
        if (!clientName.trim() || !clientAddress.trim() || selectedProducts.length === 0) {
            showTimedMessage('Please fill all required fields and add at least one product.', 3000);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const orderData = {
                clientName: clientName.trim(),
                clientAddress: clientAddress.trim(),
                products: selectedProducts, // This array will be processed by the backend
            };
            // Note: The backend route for placing orders is '/orders/place' based on previous discussions.
            // If it's still '/orders', please adjust the backend routes accordingly.
            await API.post('/orders/place', orderData, { // Changed to /orders/place
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            showTimedMessage('Order created successfully!', 3000, 'success');
            navigate('/orders'); // Redirect to order list
        } catch (err) {
            console.error('Error creating order:', err);
            setError(err.response?.data?.message || 'Failed to create order.');
            showTimedMessage(err.response?.data?.message || 'Failed to create order.', 5000, 'error');
        } finally {
            setLoading(false);
        }
    }, [clientName, clientAddress, selectedProducts, token, navigate, showTimedMessage, availableProducts]);

    if (loadingAuthState) {
        return (
            <div className="flex items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-300">
                <p className="text-indigo-600 dark:text-indigo-300">Loading authentication state...</p>
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
                    <PlusCircle className="w-8 h-8 mr-3 text-purple-500 dark:text-purple-300" />
                    Create New Order
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
                            placeholder="Enter Client Name"
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
                            placeholder="e.g., Pune, India"
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Product Selection */}
                <div className="p-4 border border-gray-300 rounded-lg dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Add Products to Order</h3>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <select
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            onChange={(e) => handleAddProductToOrder(e.target.value)}
                            value="" // Reset select after adding
                        >
                            <option value="">-- Select a Product --</option>
                            {availableProducts.length > 0 ? (
                                availableProducts.map(product => (
                                    <option key={product._id} value={product._id} disabled={product.stock === 0}>
                                        {product.name} ({product.sku}) - Stock: {product.stock} - ${product.price.toFixed(2)}
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>No products available</option>
                            )}
                        </select>
                        <button
                            type="button"
                            onClick={() => { /* Logic is handled by select onChange */ }}
                            className="px-5 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors duration-200 shadow-md"
                            disabled={availableProducts.length === 0}
                        >
                            Add Selected
                        </button>
                    </div>

                    {/* Selected Products List */}
                    <div className="space-y-3">
                        {selectedProducts.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">No products added to this order yet.</p>
                        ) : (
                            selectedProducts.map(item => {
                                const product = availableProducts.find(p => p._id === item.productId);
                                if (!product) return null; // Should not happen if data is consistent

                                return (
                                    <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <span className="font-medium text-gray-800 dark:text-gray-100">{product.name}</span>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max={product.stock}
                                                value={item.quantity}
                                                onChange={(e) => handleUpdateProductQuantity(item.productId, parseInt(e.target.value))}
                                                className="w-20 p-2 border border-gray-300 rounded-lg text-center dark:bg-gray-600 dark:text-white"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300">x ${product.price.toFixed(2)}</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                = ${(item.quantity * product.price).toFixed(2)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveProductFromOrder(item.productId)}
                                                className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="text-right text-xl font-bold text-gray-900 dark:text-white mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        Total: ${calculateTotalPrice().toFixed(2)}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || selectedProducts.length === 0}
                    // Adjusted width to w-auto and centered with mx-auto
                    className="w-auto mx-auto flex items-center justify-center bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-indigo-700 transition-all duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <PlusCircle className="w-5 h-5 mr-2" />
                    )}
                    {loading ? 'Creating Order...' : 'Create Order'}
                </button>
            </form>
        </div>
    );
}

export default AddOrderPage;
