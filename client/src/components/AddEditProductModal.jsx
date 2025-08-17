import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axios.js';
import { useNotification } from './Notification.jsx'; // Assuming Notification.jsx provides useNotification
import { XCircle, Loader2, Package, Edit, Eye } from 'lucide-react'; // Changed X to XCircle for better UI
import { useTheme } from '../context/ThemeContext.jsx'; // Assuming ThemeContext.jsx provides useTheme

// Helper function to safely parse JSON or return an empty object
const safeParseJson = (jsonString) => {
    try {
        const parsed = JSON.parse(jsonString);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (e) {
        console.error("Error parsing JSON for custom fields:", e);
        return {};
    }
};

// Helper function to safely stringify JSON or return an empty string
const safeStringifyJson = (jsonObject) => {
    try {
        return JSON.stringify(jsonObject, null, 2); // Pretty print for readability
    } catch (e) {
        console.error("Error stringifying JSON for custom fields:", e);
        return '{}';
    }
};

function AddEditProductModal({ isOpen, onClose, product, isViewMode = false, onProductSaved }) {
    const { showTimedMessage } = useNotification();
    const { theme } = useTheme();

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '', // Will store category ID
        stock: 0,
        price: 0,
        description: '',
        image: '',
        supplier: '',
        customFields: '{}', // Stored as JSON string for input
        binLocation: 'Main',
        lowStockThreshold: 50,
    });
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // Fetch categories when the modal opens or product changes (to ensure category dropdown is populated)
    useEffect(() => {
        if (isOpen) {
            const fetchCategories = async () => {
                setLoadingCategories(true);
                try {
                    const response = await API.get('/categories'); // Assuming this endpoint returns all categories
                    setCategories(response.data);
                } catch (err) {
                    console.error('Failed to fetch categories:', err);
                    showTimedMessage('Failed to load categories for selection.', 3000, 'error');
                } finally {
                    setLoadingCategories(false);
                }
            };
            fetchCategories();
        }
    }, [isOpen, showTimedMessage]);

    // Populate form data when product prop changes (for edit/view mode)
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                sku: product.sku || '',
                // If category is an object, use its _id; otherwise, it might be a string (old data)
                category: product.category?._id || product.category || '',
                stock: product.stock || 0,
                price: product.price || 0,
                description: product.description || '',
                image: product.image || '',
                supplier: product.supplier || '',
                customFields: safeStringifyJson(product.customFields || {}), // Convert object to JSON string
                binLocation: product.binLocation || 'Main',
                lowStockThreshold: product.lowStockThreshold || 50,
            });
        } else {
            // Reset form for adding new product
            setFormData({
                name: '',
                sku: '',
                category: '',
                stock: 0,
                price: 0,
                description: '',
                image: '',
                supplier: '',
                customFields: '{}',
                binLocation: 'Main',
                lowStockThreshold: 50,
            });
        }
        setErrors({}); // Clear errors on product change/modal open
    }, [product, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({}); // Clear previous errors

        if (isViewMode) {
            onClose(); // Just close the modal if in view mode
            setIsSaving(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                stock: Number(formData.stock),
                price: Number(formData.price),
                lowStockThreshold: Number(formData.lowStockThreshold),
                // Parse customFields JSON string back to object
                customFields: safeParseJson(formData.customFields),
            };

            let response;
            if (product && product._id) {
                // Editing existing product
                response = await API.put(`/products/${product._id}`, payload);
                showTimedMessage('Product updated successfully!', 3000, 'success');
            } else {
                // Adding new product
                response = await API.post('/products', payload);
                showTimedMessage('Product added successfully!', 3000, 'success');
            }
            onProductSaved(response.data); // Notify parent component
            onClose(); // Close modal
        } catch (err) {
            console.error('Error saving product:', err);
            const apiErrors = err.response?.data?.message;
            if (apiErrors) {
                if (typeof apiErrors === 'string') {
                    setErrors({ general: apiErrors });
                } else if (Array.isArray(apiErrors)) {
                    setErrors({ general: apiErrors.join(', ') });
                } else if (typeof apiErrors === 'object') {
                    setErrors(apiErrors); // Assuming API returns field-specific errors
                }
            } else {
                setErrors({ general: 'Failed to save product. Please try again.' });
            }
            showTimedMessage(apiErrors || 'Failed to save product.', 5000, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`relative rounded-xl shadow-2xl p-6 w-full max-w-3xl transform transition-all duration-300 scale-100 opacity-100 overflow-y-auto max-h-[90vh]
                ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
            `}>
                <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-semibold flex items-center">
                        {isViewMode ? <Eye className="w-6 h-6 mr-2 text-blue-500" /> : (product ? <Edit className="w-6 h-6 mr-2 text-indigo-500" /> : <Package className="w-6 h-6 mr-2 text-green-500" />)}
                        {isViewMode ? 'View Product' : (product ? 'Edit Product' : 'Add New Product')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        title="Close"
                    >
                        <XCircle className="w-7 h-7" />
                    </button>
                </div>

                {errors.general && (
                    <div className="p-3 mb-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Product Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            readOnly={isViewMode}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                ${isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                            `}
                            required
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* SKU */}
                    <div>
                        <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300">SKU</label>
                        <input
                            type="text"
                            id="sku"
                            name="sku"
                            value={formData.sku}
                            onChange={handleChange}
                            readOnly={isViewMode}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                ${isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                            `}
                        />
                        {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        {loadingCategories ? (
                            <div className="mt-1 flex items-center text-gray-500 dark:text-gray-400">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading categories...
                            </div>
                        ) : (
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                disabled={isViewMode}
                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                    ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                    ${isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                                `}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        )}
                        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                    </div>

                    {/* Stock */}
                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
                        <input
                            type="number"
                            id="stock"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            readOnly={isViewMode}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                ${isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                            `}
                            required
                        />
                        {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                    </div>

                    {/* Price */}
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price ($)</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            readOnly={isViewMode}
                            step="0.01"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                ${isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                            `}
                            required
                        />
                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                    </div>

                    {/* Supplier */}
                    <div>
                        <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supplier</label>
                        <input
                            type="text"
                            id="supplier"
                            name="supplier"
                            value={formData.supplier}
                            onChange={handleChange}
                            readOnly={isViewMode}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                ${isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                            `}
                            required
                        />
                        {errors.supplier && <p className="text-red-500 text-xs mt-1">{errors.supplier}</p>}
                    </div>

                    {/* Bin Location */}
                    <div>
                        <label htmlFor="binLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bin Location</label>
                        <input
                            type="text"
                            id="binLocation"
                            name="binLocation"
                            value={formData.binLocation}
                            onChange={handleChange}
                            readOnly={isViewMode}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                ${isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                            `}
                        />
                        {errors.binLocation && <p className="text-red-500 text-xs mt-1">{errors.binLocation}</p>}
                    </div>

                    {/* Low Stock Threshold */}
                    <div>
                        <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Low Stock Threshold</label>
                        <input
                            type="number"
                            id="lowStockThreshold"
                            name="lowStockThreshold"
                            value={formData.lowStockThreshold}
                            onChange={handleChange}
                            readOnly={isViewMode}
                            min="0"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                ${isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                            `}
                        />
                        {errors.lowStockThreshold && <p className="text-red-500 text-xs mt-1">{errors.lowStockThreshold}</p>}
                    </div>

                    {/* Image URL */}
                    <div className="md:col-span-2">
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image URL</label>
                        <input
                            type="text"
                            id="image"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            readOnly={isViewMode}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                ${isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                            `}
                        />
                        {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            readOnly={isViewMode}
                            rows="3"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                ${isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                            `}
                            required
                        ></textarea>
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>

                    {/* Custom Fields (as JSON string for now) */}
                    <div className="md:col-span-2">
                        <label htmlFor="customFields" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Fields (JSON)</label>
                        <textarea
                            id="customFields"
                            name="customFields"
                            value={formData.customFields}
                            onChange={handleChange}
                            readOnly={isViewMode}
                            rows="5"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm font-mono text-xs focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                ${isViewMode ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
                            `}
                            placeholder='e.g., {"weight": "10kg", "material": "steel"}'
                        ></textarea>
                        {errors.customFields && <p className="text-red-500 text-xs mt-1">{errors.customFields}</p>}
                        {!isViewMode && <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Enter custom fields as a valid JSON object.</p>}
                    </div>

                    {!isViewMode && (
                        <div className="md:col-span-2 flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className={`px-6 py-2 rounded-xl border transition-colors duration-200
                                    ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 border-gray-300 text-gray-700 hover:bg-gray-300'}
                                `}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`px-6 py-2 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2
                                    ${isSaving
                                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105'
                                    }
                                `}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    product ? 'Update Product' : 'Add Product'
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default AddEditProductModal;
