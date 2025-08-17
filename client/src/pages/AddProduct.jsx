// client/src/pages/AddProduct.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, Loader2, XCircle, Package } from 'lucide-react';

// Mock data (for development/testing purposes)
const mockCategories = [
    { _id: 'cat001', name: 'Electronics' },
    { _id: 'cat002', name: 'Accessories' },
];

const mockSuppliers = [
    { _id: 'sup001', name: 'Global Tech Solutions' },
    { _id: 'sup002', name: 'Eco-Friendly Supplies Co.' },
];

const mockProducts = [
    { _id: 'prod001', name: 'Laptop Pro', sku: 'LP-001', stock: 50, isBundle: false },
    { _id: 'prod002', name: 'Wireless Mouse', sku: 'WM-005', stock: 200, isBundle: false },
    { _id: 'prod003', name: 'Mechanical Keyboard', sku: 'MK-010', stock: 150, isBundle: false },
    { _id: 'prod004', name: 'Monitor 27-inch', sku: 'M27-003', stock: 75, isBundle: false },
];

function AddProductPage() {
    const { isAuthenticated, loadingAuthState } = useAuth();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [category, setCategory] = useState('');
    const [stock, setStock] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [supplier, setSupplier] = useState('');
    const [binLocation, setBinLocation] = useState('');
    const [lowStockThreshold, setLowStockThreshold] = useState('');

    const [isBundle, setIsBundle] = useState(false);
    const [bundleComponents, setBundleComponents] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    const [loadingForm, setLoadingForm] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const fetchInitialData = useCallback(async () => {
        setLoadingForm(true);
        try {
            const [categoriesRes, suppliersRes, productsRes] = await Promise.all([
                API.get('/categories'),
                API.get('/suppliers/all'),
                API.get('/products/all')
            ]);

            if (categoriesRes.data && categoriesRes.data.length > 0) {
                setCategories(categoriesRes.data);
                if (!category) setCategory(categoriesRes.data[0]._id);
            } else {
                showTimedMessage('No categories from API. Using default categories.', 4000, 'info');
                setCategories(mockCategories);
                if (mockCategories.length > 0 && !category) {
                    setCategory(mockCategories[0]._id);
                }
            }

            if (suppliersRes.data && suppliersRes.data.length > 0) {
                setSuppliers(suppliersRes.data);
                if (!supplier) setSupplier(suppliersRes.data[0].name);
            } else {
                showTimedMessage('No suppliers from API. Using default suppliers.', 4000, 'info');
                setSuppliers(mockSuppliers);
                if (mockSuppliers.length > 0 && !supplier) {
                    setSupplier(mockSuppliers[0].name);
                }
            }

            if (productsRes.data && productsRes.data.length > 0) {
                const nonBundleProducts = productsRes.data.filter(p => !p.isBundle);
                setAllProducts(nonBundleProducts);
            } else {
                showTimedMessage('No products from API. Using mock products for bundle components.', 4000, 'info');
                setAllProducts(mockProducts.filter(p => !p.isBundle));
            }

        } catch (err) {
            console.error('Error fetching initial data:', err);
            showTimedMessage('Failed to load initial form data. Some fields might be missing.', 5000, 'error');
            setCategories(mockCategories);
            setSuppliers(mockSuppliers);
            setAllProducts(mockProducts.filter(p => !p.isBundle));
            if (mockCategories.length > 0 && !category) setCategory(mockCategories[0]._id);
            if (mockSuppliers.length > 0 && !supplier) setSupplier(mockSuppliers[0].name);
        } finally {
            setLoadingForm(false);
        }
    }, [showTimedMessage, category, supplier]);

    useEffect(() => {
        if (!loadingAuthState && isAuthenticated) {
            fetchInitialData();
        } else if (!loadingAuthState && !isAuthenticated) {
            navigate('/login');
        }
    }, [loadingAuthState, isAuthenticated, navigate, fetchInitialData]);

    const handleAddComponent = () => {
        setBundleComponents([...bundleComponents, { product: '', quantity: 1 }]);
    };

    const handleComponentChange = (index, field, value) => {
        const newComponents = [...bundleComponents];
        newComponents[index][field] = value;
        setBundleComponents(newComponents);
    };

    const handleRemoveComponent = (index) => {
        const newComponents = bundleComponents.filter((_, i) => i !== index);
        setBundleComponents(newComponents);
    };

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            showTimedMessage('You must be logged in to add a product.', 3000, 'error');
            return;
        }

        setError(null);

        if (!name.trim() || !category || !description.trim()) {
            showTimedMessage('Please fill in Product Name, Category, and Description.', 3000, 'error');
            return;
        }

        let productPayload = {
            name: name.trim(),
            sku: sku.trim(),
            category: category,
            description: description.trim(),
            image: image.trim() || 'https://placehold.co/600x400/cccccc/ffffff?text=No+Image',
            binLocation: binLocation.trim(),
            lowStockThreshold: lowStockThreshold !== '' ? parseInt(lowStockThreshold) : undefined,
            isBundle: isBundle,
        };

        if (isBundle) {
            if (bundleComponents.length === 0) {
                showTimedMessage('Bundle products must have at least one component.', 3000, 'error');
                return;
            }
            const uniqueComponentIds = new Set();
            for (const comp of bundleComponents) {
                if (!comp.product || !comp.quantity || parseInt(comp.quantity) < 1) {
                    showTimedMessage('All bundle components must have a selected product and a quantity of 1 or more.', 5000, 'error');
                    return;
                }
                if (uniqueComponentIds.has(comp.product)) {
                    showTimedMessage('Duplicate products found in bundle components.', 5000, 'error');
                    return;
                }
                uniqueComponentIds.add(comp.product);
            }
            productPayload.bundleComponents = bundleComponents.map(comp => ({
                product: comp.product,
                quantity: parseInt(comp.quantity)
            }));
            // For bundles, stock and price will be calculated on the backend.
            // Sending 0 or empty string here is fine as backend will override.
            productPayload.stock = 0;
            productPayload.price = 0;
            productPayload.supplier = supplier.trim() || 'N/A';
        } else {
            if (stock === '' || price === '' || !supplier.trim()) {
                showTimedMessage('Please fill in Stock, Price, and Supplier for a regular product.', 3000, 'error');
                return;
            }
            productPayload.stock = parseInt(stock);
            productPayload.price = parseFloat(price);
            productPayload.supplier = supplier.trim();
        }

        setSubmitting(true);

        try {
            console.log('DEBUG: Submitting product payload:', productPayload);
            await API.post('/products', productPayload);
            showTimedMessage('Product added successfully!', 3000, 'success');
            navigate('/products');
        } catch (err) {
            console.error('Error adding product:', err);
            setError(err.response?.data?.message || 'Failed to add product.');
            showTimedMessage(err.response?.data?.message || 'Failed to add product.', 5000, 'error');
        } finally {
            setSubmitting(false);
        }
    }, [name, sku, category, stock, price, description, image, supplier, binLocation, lowStockThreshold, isBundle, bundleComponents, isAuthenticated, navigate, showTimedMessage]);

    if (loadingAuthState || loadingForm) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-lg font-medium text-blue-600 dark:text-blue-300">Loading form data...</span>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:shadow-none transition-colors duration-300">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/products')}
                    className="mr-3 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                    title="Back to Products"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-3xl font-bold text-indigo-700 flex items-center dark:text-indigo-300">
                    <PlusCircle className="w-8 h-8 mr-3 text-purple-500 dark:text-purple-300" />
                    Add New Product
                </h2>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 dark:bg-red-900 dark:text-red-200">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Product Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., SuperCut Diamond Grinding Wheel"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
                <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">SKU (Optional)</label>
                    <input
                        type="text"
                        id="sku"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="e.g., ABC-123, XYZ-456"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Category</label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        {loadingForm ? (
                            <option value="">Loading categories...</option>
                        ) : categories.length > 0 ? (
                            categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))
                        ) : (
                            <option value="">No categories available</option>
                        )}
                    </select>
                </div>

                <div className="flex items-center mt-4">
                    <input
                        type="checkbox"
                        id="isBundle"
                        checked={isBundle}
                        onChange={(e) => setIsBundle(e.target.checked)}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isBundle" className="ml-2 block text-base font-medium text-gray-700 dark:text-gray-200">
                        This is a Product Bundle/Kit
                    </label>
                </div>

                {isBundle ? (
                    <div className="border border-dashed border-indigo-300 dark:border-indigo-600 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                        <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center">
                            <Package className="w-5 h-5 mr-2" /> Bundle Components
                        </h3>
                        {bundleComponents.length === 0 && (
                            <p className="text-gray-600 dark:text-gray-400 mb-3">Add individual products that make up this bundle.</p>
                        )}
                        {bundleComponents.map((component, index) => (
                            <div key={index} className="flex flex-col md:flex-row items-center gap-3 mb-3 p-3 border border-indigo-200 dark:border-indigo-700 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
                                <div className="flex-1 w-full">
                                    <label htmlFor={`component-product-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Component Product</label>
                                    <select
                                        id={`component-product-${index}`}
                                        value={component.product}
                                        onChange={(e) => handleComponentChange(index, 'product', e.target.value)}
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500
                                                 bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                                    >
                                        <option value="">Select Product</option>
                                        {allProducts.map((prod) => (
                                            <option key={prod._id} value={prod._id} disabled={bundleComponents.some(c => c.product === prod._id && c.product !== component.product)}>
                                                {prod.name} (Stock: {prod.stock})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full md:w-24">
                                    <label htmlFor={`component-quantity-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        id={`component-quantity-${index}`}
                                        value={component.quantity}
                                        onChange={(e) => handleComponentChange(index, 'quantity', e.target.value)}
                                        min="1"
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500
                                                 bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveComponent(index)}
                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 mt-auto md:mt-0"
                                    title="Remove Component"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddComponent}
                            className="mt-3 w-full bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors duration-200 flex items-center justify-center text-sm font-medium"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" /> Add Component
                        </button>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                            * Note: For bundle products, the "Stock" and "Price" fields are calculated automatically on the backend based on components. The fields below are hidden.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Stock</label>
                                <input
                                    type="number"
                                    id="stock"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    placeholder="e.g., 100"
                                    required={!isBundle}
                                    min="0"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            </div>
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Price ($)</label>
                                <input
                                    type="number"
                                    id="price"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="e.g., 599.99"
                                    required={!isBundle}
                                    min="0"
                                    step="0.01"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Supplier</label>
                            <select
                                id="supplier"
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value)}
                                required={!isBundle}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {loadingForm ? (
                                    <option value="">Loading suppliers...</option>
                                ) : suppliers.length > 0 ? (
                                    suppliers.map((sup) => (
                                        <option key={sup._id} value={sup.name}>
                                            {sup.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">No suppliers available</option>
                                )}
                            </select>
                        </div>
                    </>
                )}

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detailed description of the product"
                        required
                        rows="4"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Image URL (Optional)</label>
                    <input
                        type="text"
                        id="image"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="e.g., https://example.com/product.jpg"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
                <div>
                    <label htmlFor="binLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Bin Location (Optional)</label>
                    <input
                        type="text"
                        id="binLocation"
                        value={binLocation}
                        onChange={(e) => setBinLocation(e.target.value)}
                        placeholder="e.g., A1-Shelf2"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
                <div>
                    <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Low Stock Threshold (Optional)</label>
                    <input
                        type="number"
                        id="lowStockThreshold"
                        value={lowStockThreshold}
                        onChange={(e) => setLowStockThreshold(e.target.value)}
                        placeholder="e.g., 10"
                        min="0"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting || loadingForm}
                    className="w-auto mx-auto flex items-center justify-center bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-indigo-700 transition-all duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <Loader2 className="animate-spin h-5 w-5 mr-3 text-white" />
                    ) : (
                        <PlusCircle className="w-5 h-5 mr-2" />
                    )}
                    {submitting ? 'Adding Product...' : 'Add Product'}
                </button>
            </form>
        </div>
    );
}

export default AddProductPage;
