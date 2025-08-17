// client/src/pages/Admin/Categories.jsx // Corrected file path comment

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import API from '../../../api/axios.js';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Folder, PlusCircle, Edit, Trash2, Search, RefreshCw, ArrowLeft, Save } from 'lucide-react';

function CategoryPage({ showTimedMessage }) {
    const { token, loadingAuthState } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { id: urlId } = useParams();

    // State to manage the current view mode: 'list', 'add', 'edit'
    const [viewMode, setViewMode] = useState('list');
    // State to store the ID of the category currently being edited
    const [editingCategoryId, setEditingCategoryId] = useState(null);

    // States for category data (for forms)
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    // States for list view
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formLoading, setFormLoading] = useState(false); // Loading for add/edit forms

    // Effect to handle initial view mode based on URL
    useEffect(() => {
        if (urlId) {
            setEditingCategoryId(urlId);
            setViewMode('edit');
        } else if (location.pathname.endsWith('/categories/add')) {
            // This case might not be hit if we only use /categories,
            // but good for robustness if direct link is used.
            setViewMode('add');
        } else {
            setViewMode('list');
        }
    }, [urlId, location.pathname]);

    // --- Data Fetching for List View ---
    const fetchCategories = useCallback(async () => {
        if (!token) {
            setLoadingCategories(false);
            return;
        }
        setLoadingCategories(true);
        setError(null);
        try {
            const response = await API.get('/categories');
            setCategories(response.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to load categories. Please try again.');
            showTimedMessage('Failed to load categories.', 5000);
        } finally {
            setLoadingCategories(false);
        }
    }, [token, showTimedMessage]);

    useEffect(() => {
        if (!loadingAuthState && viewMode === 'list') {
            fetchCategories();
        }
    }, [loadingAuthState, viewMode, fetchCategories]);

    // --- Form Handlers (Add/Edit) ---
    const handleAddSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!token) {
            showTimedMessage('You must be logged in to add a category.', 3000);
            return;
        }
        if (!name.trim()) {
            showTimedMessage('Category name is required.', 3000);
            return;
        }

        setFormLoading(true);
        setError(null);

        try {
            const newCategory = { name: name.trim(), description: description.trim() };
            await API.post('/categories', newCategory);
            showTimedMessage('Category added successfully!', 3000);
            setName(''); // Clear form
            setDescription('');
            setViewMode('list'); // Go back to list view
            fetchCategories(); // Refresh list
        } catch (err) {
            console.error('Error adding category:', err);
            setError(err.response?.data?.message || 'Failed to add category.');
            showTimedMessage(err.response?.data?.message || 'Failed to add category.', 5000);
        } finally {
            setFormLoading(false);
        }
    }, [name, description, token, showTimedMessage, fetchCategories]);

    const handleEditSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!token) {
            showTimedMessage('You must be logged in to edit a category.', 3000);
            return;
        }
        if (!name.trim()) {
            showTimedMessage('Category name is required.', 3000);
            return;
        }
        if (!editingCategoryId) {
            showTimedMessage('No category selected for editing.', 3000);
            return;
        }

        setFormLoading(true);
        setError(null);

        try {
            const updatedCategory = { name: name.trim(), description: description.trim() };
            await API.put(`/categories/${editingCategoryId}`, updatedCategory);
            showTimedMessage('Category updated successfully!', 3000);
            setName(''); // Clear form
            setDescription('');
            setEditingCategoryId(null); // Clear editing ID
            setViewMode('list'); // Go back to list view
            fetchCategories(); // Refresh list
        } catch (err) {
            console.error('Error updating category:', err);
            setError(err.response?.data?.message || 'Failed to update category.');
            showTimedMessage(err.response?.data?.message || 'Failed to update category.', 5000);
        } finally {
            setFormLoading(false);
        }
    }, [editingCategoryId, name, description, token, showTimedMessage, fetchCategories]);

    // --- Fetch single category for Edit Form ---
    const fetchSingleCategory = useCallback(async (idToEdit) => {
        if (!token || !idToEdit) {
            // Corrected: Removed `setLoading(false)` as `loading` state is not defined in this scope.
            // Using `setFormLoading(false)` instead, as it's the relevant state for form data fetching.
            setFormLoading(false);
            return;
        }
        setFormLoading(true);
        setError(null);
        try {
            const response = await API.get(`/categories/${idToEdit}`);
            setName(response.data.name);
            setDescription(response.data.description || '');
        } catch (err) {
            console.error('Error fetching category for edit:', err);
            setError(err.response?.data?.message || 'Failed to load category for editing.');
            showTimedMessage(err.response?.data?.message || 'Failed to load category for editing.', 5000);
            setViewMode('list'); // Go back to list if fetch fails
        } finally {
            setFormLoading(false);
        }
    }, [token, showTimedMessage]);

    useEffect(() => {
        if (!loadingAuthState && viewMode === 'edit' && editingCategoryId) {
            fetchSingleCategory(editingCategoryId);
        }
    }, [loadingAuthState, viewMode, editingCategoryId, fetchSingleCategory]);


    // --- Delete Handler ---
    const handleDelete = async (categoryId) => {
        const userConfirmed = window.confirm('Are you sure you want to delete this category? This action cannot be undone.');
        if (!userConfirmed) {
            return;
        }

        try {
            await API.delete(`/categories/${categoryId}`);
            showTimedMessage('Category deleted successfully!', 3000);
            fetchCategories(); // Re-fetch categories to update the list
        } catch (err) {
            console.error('Error deleting category:', err);
            showTimedMessage(err.response?.data?.message || 'Failed to delete category.', 5000);
        }
    };

    const filteredCategories = categories.filter(category => {
        const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    // --- Loading and Error States for the whole page ---
    if (loadingAuthState) {
        return (
            <div className="flex items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-300">
                <p className="text-indigo-600 dark:text-indigo-300">Authenticating...</p>
            </div>
        );
    }

    // --- Render Logic based on viewMode ---
    const renderContent = () => {
        if (viewMode === 'add') {
            return (
                <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:shadow-none transition-colors duration-300">
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => { setViewMode('list'); setName(''); setDescription(''); setError(null); }}
                            className="mr-3 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                            title="Back to Categories"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-3xl font-bold text-indigo-700 flex items-center dark:text-indigo-300">
                            <PlusCircle className="w-8 h-8 mr-3 text-purple-500 dark:text-purple-300" />
                            Add New Category
                        </h2>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 dark:bg-red-900 dark:text-red-200">
                            <strong className="font-bold">Error!</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                    )}

                    <form onSubmit={handleAddSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Category Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Electronics, Clothing, Books"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description (Optional)</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="A brief description of the category"
                                rows="4"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="w-full flex items-center justify-center bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-indigo-700 transition-all duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {formLoading ? (
                                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <PlusCircle className="w-5 h-5 mr-2" />
                            )}
                            {formLoading ? 'Adding Category...' : 'Add Category'}
                        </button>
                    </form>
                </div>
            );
        } else if (viewMode === 'edit') {
            return (
                <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:shadow-none transition-colors duration-300">
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => { setViewMode('list'); setName(''); setDescription(''); setEditingCategoryId(null); setError(null); }}
                            className="mr-3 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                            title="Back to Categories"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-3xl font-bold text-indigo-700 flex items-center dark:text-indigo-300">
                            <Edit className="w-8 h-8 mr-3 text-purple-500 dark:text-purple-300" />
                            Edit Category
                        </h2>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 dark:bg-red-900 dark:text-red-200">
                            <strong className="font-bold">Error!</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                    )}

                    <form onSubmit={handleEditSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Category Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Electronics, Clothing, Books"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description (Optional)</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="A brief description of the category"
                                rows="4"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="w-full flex items-center justify-center bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-indigo-700 transition-all duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {formLoading ? (
                                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <Save className="w-5 h-5 mr-2" />
                            )}
                            {formLoading ? 'Updating Category...' : 'Update Category'}
                        </button>
                    </form>
                </div>
            );
        } else { // viewMode === 'list'
            return (
                <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:shadow-none transition-colors duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <h2 className="text-3xl font-bold text-indigo-700 flex items-center mb-4 md:mb-0 dark:text-indigo-300">
                            <Folder className="w-8 h-8 mr-3 text-purple-500 dark:text-purple-300" />
                            Manage Categories
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <button
                                onClick={() => { setViewMode('add'); setName(''); setDescription(''); setError(null); }}
                                className="flex items-center justify-center bg-indigo-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-indigo-700 transition-all duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                                <PlusCircle className="w-5 h-5 mr-2" /> Add New Category
                            </button>
                            <button
                                onClick={fetchCategories}
                                className="flex items-center justify-center bg-gray-400 text-white py-2 px-4 rounded-lg font-bold hover:bg-gray-500 transition-all duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-300"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" /> Refresh
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search categories by name or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Categories Table */}
                    {loadingCategories ? (
                        <div className="flex items-center justify-center py-10">
                            <p className="text-indigo-600 dark:text-indigo-300">Loading categories...</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-10">
                            <p className="text-red-600 dark:text-red-300">{error}</p>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                            {categories.length === 0 ? 'No categories found. Click "Add New Category" to get started!' : 'No categories match your search criteria.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg shadow-inner border border-indigo-100 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-indigo-200 dark:divide-gray-700">
                                <thead className="bg-indigo-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider rounded-tl-lg dark:text-indigo-300">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider dark:text-indigo-300">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider dark:text-indigo-300">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider rounded-tr-lg dark:text-indigo-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-indigo-100 dark:bg-gray-800 dark:divide-gray-700">
                                    {filteredCategories.map((category) => (
                                        <tr key={category._id} className="hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{category._id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{category.name}</td>
                                            <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-300 max-w-xs overflow-hidden truncate">{category.description || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCategoryId(category._id);
                                                            setName(category.name);
                                                            setDescription(category.description || '');
                                                            setViewMode('edit');
                                                            setError(null); // Clear previous errors
                                                        }}
                                                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition-colors duration-200 dark:text-indigo-300 dark:hover:bg-gray-700"
                                                        title="Edit Category"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(category._id)}
                                                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition-colors duration-200 dark:text-red-400 dark:hover:bg-gray-700"
                                                        title="Delete Category"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            );
        }
    };

    return renderContent();
}

export default CategoryPage;
