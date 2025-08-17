import React, { useState, useEffect } from 'react';
import API from '../api/axios.js';
import { useNotification } from './Notification.jsx';
import { XCircle, Loader2, Layers, Edit, PlusCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

function AddEditCategoryModal({ isOpen, onClose, category, onCategorySaved }) {
    const { showTimedMessage } = useNotification();
    const { theme } = useTheme();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        defaultLowStockThreshold: 100, // Default value
    });
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                description: category.description || '',
                defaultLowStockThreshold: category.defaultLowStockThreshold || 100,
            });
        } else {
            // Reset form for adding new category
            setFormData({
                name: '',
                description: '',
                defaultLowStockThreshold: 100,
            });
        }
        setErrors({}); // Clear errors on category change/modal open
    }, [category, isOpen]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrors({}); // Clear previous errors

        try {
            let response;
            if (category && category._id) {
                // Editing existing category
                response = await API.put(`/categories/${category._id}`, formData);
                showTimedMessage('Category updated successfully!', 3000, 'success');
            } else {
                // Adding new category
                response = await API.post('/categories', formData);
                showTimedMessage('Category added successfully!', 3000, 'success');
            }
            onCategorySaved(response.data); // Notify parent component
            onClose(); // Close modal
        } catch (err) {
            console.error('Error saving category:', err);
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
                setErrors({ general: 'Failed to save category. Please try again.' });
            }
            showTimedMessage(apiErrors || 'Failed to save category.', 5000, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`relative rounded-xl shadow-2xl p-6 w-full max-w-xl transform transition-all duration-300 scale-100 opacity-100 overflow-y-auto max-h-[90vh]
                ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
            `}>
                <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-semibold flex items-center">
                        {category ? <Edit className="w-6 h-6 mr-2 text-indigo-500" /> : <PlusCircle className="w-6 h-6 mr-2 text-green-500" />}
                        {category ? 'Edit Category' : 'Add New Category'}
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

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                    {/* Category Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                            `}
                            required
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                            `}
                        ></textarea>
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>

                    {/* Default Low Stock Threshold */}
                    <div>
                        <label htmlFor="defaultLowStockThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Low Stock Threshold</label>
                        <input
                            type="number"
                            id="defaultLowStockThreshold"
                            name="defaultLowStockThreshold"
                            value={formData.defaultLowStockThreshold}
                            onChange={handleChange}
                            min="0"
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                            `}
                        />
                        {errors.defaultLowStockThreshold && <p className="text-red-500 text-xs mt-1">{errors.defaultLowStockThreshold}</p>}
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">This threshold will apply to new products in this category unless a product-specific threshold is set.</p>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
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
                                category ? 'Update Category' : 'Add Category'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddEditCategoryModal;
