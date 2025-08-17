import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { Package, PlusCircle, Edit, Trash2, Search, Filter, RefreshCw, Layers, Eye, Loader2, Component } from 'lucide-react'; // Added Component icon
import AddEditProductModal from '../components/AddEditProductModal.jsx'; // For View mode
import ConfirmationModal from '../components/ConfirmationModal.jsx'; // Import the ConfirmationModal

// Mock Product Data (as a fallback if API fails or is empty)
const mockProducts = [
    { _id: 'prod001', name: 'Wireless Mouse', sku: 'WM-001', category: { _id: 'cat001', name: 'electronics' }, stock: 150, price: 25.99, supplier: 'Tech Gadgets Inc.', lastUpdated: '2025-07-01', image: 'https://placehold.co/100x100/000000/FFFFFF?text=Mouse', isBundle: false, bundleComponents: [] },
    { _id: 'prod002', name: 'Mechanical Keyboard', sku: 'MK-002', category: { _id: 'cat001', name: 'electronics' }, stock: 80, price: 99.99, supplier: 'Keytronics Co.', lastUpdated: '2025-07-05', image: 'https://placehold.co/100x100/000000/FFFFFF?text=Keyboard', isBundle: false, bundleComponents: [] },
    { _id: 'prod003', name: 'USB-C Hub', sku: 'UCH-003', category: { _id: 'cat002', name: 'accessories' }, stock: 200, price: 35.00, supplier: 'ConnectAll Ltd.', lastUpdated: '2025-06-28', image: 'https://placehold.co/100x100/000000/FFFFFF?text=USB+Hub', isBundle: false, bundleComponents: [] },
    { _id: 'prod004', name: 'Gaming Headset', sku: 'GH-004', category: { _id: 'cat001', name: 'electronics' }, stock: 60, price: 75.50, supplier: 'AudioZone', lastUpdated: '2025-07-03', image: 'https://placehold.co/100x100/000000/FFFFFF?text=Headset', isBundle: false, bundleComponents: [] },
    { _id: 'prod005', name: 'Monitor Stand', sku: 'MS-005', category: { _id: 'cat003', name: 'office supplies' }, stock: 120, price: 45.00, supplier: 'ErgoSolutions', lastUpdated: '2025-07-02', image: 'https://placehold.co/100x100/000000/FFFFFF?text=Stand', isBundle: false, bundleComponents: [] },
    { _id: 'prod006', name: 'SuperCut Diamond Grinding Wheel', sku: 'SC-DGW-001', category: { _id: 'cat004', name: 'grinding wheels' }, stock: 75, price: 120.00, supplier: 'SuperCut Abrasives', lastUpdated: '2025-07-17', image: 'https://placehold.co/100x100/000000/FFFFFF?text=Grind+Wheel', isBundle: false, bundleComponents: [] },
    // Example Bundle Product
    {
        _id: 'bundle001',
        name: 'Office Starter Kit',
        sku: 'OSK-2025',
        category: { _id: 'cat003', name: 'office supplies' },
        stock: 10, // This is the stock of the assembled bundle
        price: 150.00, // This is the price of the bundle
        description: 'A complete kit for your new office setup.',
        image: 'https://placehold.co/100x100/0000FF/FFFFFF?text=Office+Bundle',
        supplier: 'Various',
        lastUpdated: '2025-07-18',
        isBundle: true,
        bundleComponents: [ // Mock populated components for display
            { product: { _id: 'prod001', name: 'Wireless Mouse', sku: 'WM-001', stock: 150, image: 'https://placehold.co/50x50' }, quantity: 1 },
            { product: { _id: 'prod005', name: 'Monitor Stand', sku: 'MS-005', stock: 120, image: 'https://placehold.co/50x50' }, quantity: 1 }
        ]
    }
];

function ProductListPage() {
    const { isAuthenticated, loading: authLoading, token, user } = useAuth();
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [errorProducts, setErrorProducts] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [sortOrder, setSortOrder] = useState('name-asc');

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [productToView, setProductToView] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [productIdToDelete, setProductIdToDelete] = useState(null);

    const fetchProducts = useCallback(async () => {
        setLoadingProducts(true);
        setErrorProducts(null);
        setIsRefreshing(true);

        if (!token) {
            setLoadingProducts(false);
            setIsRefreshing(false);
            setProducts(mockProducts);
            showTimedMessage('Authentication token missing. Using mock products.', 3000, 'error');
            return;
        }

        try {
            const response = await API.get('/products'); // This fetches products with populated category and bundleComponents
            if (response.data && Array.isArray(response.data)) {
                setProducts(response.data);
                showTimedMessage('Products loaded successfully!', 2000, 'success');
            } else {
                console.warn('API /products returned no data or invalid format. Using mock products.');
                showTimedMessage('No products from API. Using default mock data.', 4000, 'info');
                setProducts(mockProducts);
            }
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setErrorProducts(err.response?.data?.message || 'Failed to load products. Please try again.');
            showTimedMessage(err.response?.data?.message || 'Failed to load products.', 5000, 'error');
            setProducts(mockProducts);
        } finally {
            setLoadingProducts(false);
            setIsRefreshing(false);
        }
    }, [token, showTimedMessage]);

    const openDeleteConfirmation = (productId) => {
        setProductIdToDelete(productId);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteProduct = async () => {
        setIsConfirmModalOpen(false);
        if (!productIdToDelete) return;

        showTimedMessage('Deleting product...', 1500, 'info');
        try {
            await API.delete(`/products/${productIdToDelete}`);
            setProducts(prev => prev.filter(p => p._id !== productIdToDelete));
            showTimedMessage('Product deleted successfully!', 3000, 'success');
        } catch (err) {
            console.error('Failed to delete product:', err);
            showTimedMessage(err.response?.data?.message || 'Failed to delete product. Please try again.', 5000, 'error');
        } finally {
            setProductIdToDelete(null);
        }
    };

    const cancelDeleteProduct = () => {
        setIsConfirmModalOpen(false);
        setProductIdToDelete(null);
        showTimedMessage('Product deletion cancelled.', 2000, 'info');
    };

    const navigateToAddProduct = () => {
        navigate('/products/add');
    };

    const navigateToEditProduct = (productId) => {
        navigate(`/products/edit/${productId}`);
    };

    const openViewModal = (product) => {
        setProductToView(product);
        setIsViewMode(true);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setProductToView(null);
        setIsViewMode(false);
    };

    useEffect(() => {
        if (!authLoading) {
            if (isAuthenticated && user?.role === 'admin') {
                fetchProducts();
            } else if (!isAuthenticated) {
                navigate('/login');
            } else {
                showTimedMessage('Access denied. You must be an admin to view this page.', 3000, 'error');
                navigate('/client/dashboard');
            }
        }
    }, [isAuthenticated, authLoading, user, fetchProducts, navigate, showTimedMessage]);

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = filterCategory === 'All' ||
                                (product.category && product.category.name && product.category.name.toLowerCase() === filterCategory.toLowerCase());
        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        switch (sortOrder) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'stock-asc': return (a.stock || 0) - (b.stock || 0);
            case 'stock-desc': return (b.stock || 0) - (a.stock || 0);
            case 'price-asc': return (a.price || 0) - (b.price || 0);
            case 'price-desc': return (b.price || 0) - (a.price || 0);
            default: return 0;
        }
    });

    const allCategories = new Set(
        [...mockProducts.map(p => p.category.name),
         ...products.map(p => p.category?.name)].filter(Boolean)
    );
    const uniqueCategories = ['All', ...Array.from(allCategories)];

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="flex items-center space-x-3 text-lg font-medium text-blue-600 dark:text-blue-300">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading products page...</span>
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
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-blue-800 dark:text-white">Product Inventory</h1>
                            <p className="text-blue-700 mt-1 dark:text-blue-200">Manage all your products efficiently</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <button
                            onClick={navigateToAddProduct}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2"
                        >
                            <PlusCircle className="w-4 h-4" /> Add New Product
                        </button>
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

                {/* Search, Filter, and Sort */}
                <div className={`mb-6 p-4 rounded-xl shadow-md border transition-colors duration-300 flex flex-col sm:flex-row gap-4
                    ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                `}>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'}
                            `}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500
                                ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}
                            `}
                        >
                            {uniqueCategories.map(categoryName => (
                                <option key={categoryName} value={categoryName}>{categoryName}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                    <div className="relative">
                        <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500
                                ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}
                            `}
                        >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="stock-asc">Stock (Low to High)</option>
                            <option value="stock-desc">Stock (High to Low)</option>
                            <option value="price-asc">Price (Low to High)</option>
                            <option value="price-desc">Price (High to Low)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                {/* Product Table */}
                <div className={`overflow-x-auto rounded-xl shadow-md border transition-colors duration-300
                    ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                `}>
                    {loadingProducts ? (
                        <div className="flex flex-col items-center justify-center p-8">
                            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                            <span className="ml-3 text-gray-600 dark:text-blue-200 mt-2">Loading products...</span>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="p-8 text-center text-gray-600 dark:text-gray-300">
                            No products found matching your criteria.
                            <button onClick={navigateToAddProduct} className="ml-2 text-blue-500 hover:underline">Add one?</button>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tl-xl">
                                        Image
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Product Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Type
                                    </th> {/* New column for Product Type */}
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        SKU
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Category
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Stock
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Price
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Supplier
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tr-xl">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredProducts.map((product) => (
                                    <tr key={product._id} className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors duration-150`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <img
                                                src={product.image || 'https://placehold.co/100x100/cccccc/ffffff?text=No+Image'}
                                                alt={product.name}
                                                className="w-12 h-12 object-cover rounded-md shadow-sm border border-gray-200 dark:border-gray-600"
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100/cccccc/ffffff?text=Error'; }}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {product.isBundle ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                                    <Package className="w-3 h-3 mr-1" /> Bundle
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    <Component className="w-3 h-3 mr-1" /> Single
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {product.sku}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {product.category ? product.category.name : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                ${(product.stock || 0) < 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}
                                            `}>
                                                {product.stock || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            ${(product.price || 0).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {product.supplier || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openViewModal(product)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 mr-3 transition-colors"
                                                title="View Product Details"
                                            >
                                                <Eye className="w-5 h-5 inline-block" />
                                            </button>
                                            <button
                                                onClick={() => navigateToEditProduct(product._id)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-3 transition-colors"
                                                title="Edit Product"
                                            >
                                                <Edit className="w-5 h-5 inline-block" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteConfirmation(product._id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                                                title="Delete Product"
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

            {/* View Product Modal */}
            <AddEditProductModal
                isOpen={isViewModalOpen}
                onClose={closeViewModal}
                product={productToView} // Pass the full product object, including isBundle and bundleComponents
                isViewMode={isViewMode}
            />

            {/* Confirmation Modal for Deletion */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={cancelDeleteProduct}
                onConfirm={confirmDeleteProduct}
                message="Are you sure you want to delete this product? This action cannot be undone."
                title="Confirm Deletion"
            />
        </div>
    );
}

export default ProductListPage;
