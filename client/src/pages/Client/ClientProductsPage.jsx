import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNotification } from '../../components/Notification.jsx';
import API from '../../api/axios.js';
import { Package, ShoppingCart, Search, RefreshCw, Loader2 } from 'lucide-react';
import OrderQuantityModal from '../../components/OrderQuantityModal.jsx';

// Mock Product Data (as a fallback if API fails or is empty)
// IMPORTANT: Updated category to be an object matching the populated structure
const mockProducts = [
    { _id: 'prod001', name: 'Wireless Mouse', sku: 'WM-001', category: { _id: 'cat001', name: 'electronics' }, stock: 150, price: 25.99, supplier: 'Tech Gadgets Inc.', lastUpdated: '2025-07-01' },
    { _id: 'prod002', name: 'Mechanical Keyboard', sku: 'MK-002', category: { _id: 'cat001', name: 'electronics' }, stock: 0, price: 99.99, supplier: 'Keytronics Co.', lastUpdated: '2025-07-05' }, // Stock 0 for testing
    { _id: 'prod003', name: 'USB-C Hub', sku: 'UCH-003', category: { _id: 'cat002', name: 'accessories' }, stock: 200, price: 35.00, supplier: 'ConnectAll Ltd.', lastUpdated: '2025-06-28' },
    { _id: 'prod004', name: 'Gaming Headset', sku: 'GH-004', category: { _id: 'cat001', name: 'electronics' }, stock: 60, price: 75.50, supplier: 'AudioZone', lastUpdated: '2025-07-03' },
    { _id: 'prod005', name: 'Monitor Stand', sku: 'MS-005', category: { _id: 'cat003', name: 'office supplies' }, stock: 0, price: 45.00, supplier: 'ErgoSolutions', lastUpdated: '2025-07-02' }, // Stock 0 for testing
    { _id: 'prod006', name: 'SuperCut Diamond Grinding Wheel', sku: 'SC-DGW-001', category: { _id: 'cat004', name: 'grinding wheels' }, stock: 75, price: 120.00, supplier: 'SuperCut Abrasives', lastUpdated: '2025-07-17' },
];

function ClientProductsPage() {
    const { user, isAuthenticated, loading: authLoading, isClient, token } = useAuth();
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [errorProducts, setErrorProducts] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // State for Order Quantity Modal
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Fetch products from the API
    const fetchProducts = useCallback(async () => {
        console.log('ClientProductsPage: fetchProducts called. isAuthenticated:', isAuthenticated, 'isClient:', isClient, 'token exists:', !!token);
        setLoadingProducts(true);
        setErrorProducts(null);
        setIsRefreshing(true);

        if (!isAuthenticated || !token) {
            console.log('ClientProductsPage: Not authenticated or token missing. Skipping API call. Setting products to mock data.'); // Changed to mock data
            setLoadingProducts(false);
            setIsRefreshing(false);
            setProducts(mockProducts); // Fallback to mock products
            showTimedMessage('Authentication required to view products. Using mock data.', 3000, 'error'); // Updated message
            return;
        }

        try {
            console.log('ClientProductsPage: Attempting to fetch products from /api/products...');
            const response = await API.get('/products', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('ClientProductsPage: API response received:', response.data);

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setProducts(response.data);
                showTimedMessage('Products loaded successfully!', 2000, 'success');
            } else {
                console.warn('ClientProductsPage: API /products returned no data or invalid format. Setting products to mock data.'); // Changed to mock data
                showTimedMessage('No products available from API. Using default mock data.', 4000, 'info'); // Updated message
                setProducts(mockProducts); // Fallback to mock products
            }
        } catch (err) {
            console.error('ClientProductsPage: Failed to fetch products:', err);
            setErrorProducts(err.response?.data?.message || 'Failed to load products. Please try again.');
            showTimedMessage(err.response?.data?.message || 'Failed to load products.', 5000, 'error');
            setProducts(mockProducts); // Fallback on error
        } finally {
            setLoadingProducts(false);
            setIsRefreshing(false);
        }
    }, [isAuthenticated, isClient, token, showTimedMessage]);

    // Handle "Order" button click
    const handleOrderClick = (product) => {
        // Only open modal if stock is greater than 0
        if (product.stock > 0) {
            setSelectedProduct(product);
            setIsOrderModalOpen(true);
        } else {
            showTimedMessage('This product is out of stock.', 3000, 'warning');
        }
    };

    // Handle order submission from the modal
    const handleOrderSubmit = async (productId, quantity) => {
        if (!isAuthenticated) {
            showTimedMessage('You must be logged in to place an order.', 3000, 'error');
            return;
        }
        if (quantity <= 0) {
            showTimedMessage('Quantity must be greater than zero.', 3000, 'error');
            return;
        }
        if (selectedProduct && quantity > selectedProduct.stock) {
            showTimedMessage(`Cannot order ${quantity}. Only ${selectedProduct.stock} in stock.`, 5000, 'error');
            return;
        }

        showTimedMessage('Placing order...', 1500, 'info');
        try {
            const orderData = {
                products: [{
                    productId: productId,
                    quantity: quantity
                }],
            };

            console.log('ClientProductsPage: Sending order data:', orderData);
            const response = await API.post('/orders/place', orderData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('ClientProductsPage: Order placed response:', response.data);

            showTimedMessage('Order placed successfully! Stock updated.', 3000, 'success');
            setIsOrderModalOpen(false);
            setSelectedProduct(null);
            fetchProducts(); // Refresh product list to show updated stock
        } catch (err) {
            console.error('ClientProductsPage: Error placing order:', err);
            showTimedMessage(err.response?.data?.message || 'Failed to place order. Please try again.', 5000, 'error');
        }
    };

    // Close the order quantity modal
    const closeOrderModal = () => {
        setIsOrderModalOpen(false);
        setSelectedProduct(null);
    };

    // Initial fetch on component mount and when authentication state changes
    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated || !isClient) {
                navigate('/login');
            } else {
                fetchProducts();
            }
        }
    }, [isAuthenticated, authLoading, isClient, fetchProducts, navigate]);

    // Filter products based on search term
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category && product.category.name && product.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (authLoading || loadingProducts) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="flex items-center space-x-3 text-lg font-medium text-blue-600 dark:text-blue-300">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading products for client...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !isClient) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <p className="text-red-600 dark:text-red-300">Access Denied. You must be logged in as a client to view this page.</p>
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
                            <Package className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-blue-800 dark:text-white">Available Products</h1>
                            <p className="text-blue-700 mt-1 dark:text-blue-200">Browse and order products for your needs.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <button
                            onClick={fetchProducts}
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

                {errorProducts && (
                    <div className="p-4 mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center">
                        <p>{errorProducts}</p>
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
                            placeholder="Search by name, SKU, or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'}
                            `}
                        />
                    </div>
                </div>

                {/* Products Table */}
                <div className={`overflow-x-auto rounded-xl shadow-md border transition-colors duration-300
                    ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                `}>
                    {loadingProducts ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></Loader2>
                            <span className="ml-3 text-gray-600 dark:text-blue-200">Loading products...</span>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="p-8 text-center text-gray-600 dark:text-gray-300">
                            No products found matching your criteria.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tl-xl">
                                        ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Category
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Price
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Stock
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tr-xl">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredProducts.map((product) => (
                                    <tr key={product._id} className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors duration-150`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {product._id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {product.category ? product.category.name : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            ${(product.price || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${(product.stock || 0) < 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}
                                            `}>
                                                {product.stock || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleOrderClick(product)}
                                                disabled={(product.stock || 0) <= 0} // Disable if stock is 0 or less
                                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors duration-200
                                                    ${(product.stock || 0) <= 0
                                                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                                                    }`}
                                                title={(product.stock || 0) <= 0 ? "Out of Stock" : "Place Order"}
                                            >
                                                <ShoppingCart className="w-4 h-4 mr-2" />
                                                { (product.stock || 0) <= 0 ? 'Out of Stock' : 'Order' }
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Order Quantity Modal */}
            {isOrderModalOpen && selectedProduct && (
                <OrderQuantityModal
                    isOpen={isOrderModalOpen}
                    onClose={closeOrderModal}
                    product={selectedProduct}
                    onConfirmOrder={handleOrderSubmit}
                />
            )}
        </div>
    );
}

export default ClientProductsPage;
