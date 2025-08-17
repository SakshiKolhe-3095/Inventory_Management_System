// client/src/pages/CategoryListPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { LayoutList, PlusCircle, Edit, Trash2, Search, RefreshCw } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal.jsx';

// Mock Category Data (as a fallback if API fails or is empty)
const mockCategories = [
    { _id: 'cat001', name: 'Electronics', description: 'Gadgets, components, and related items.' },
    { _id: 'cat002', name: 'Accessories', description: 'Complementary items for main products.' },
    { _id: 'cat003', name: 'Office Supplies', description: 'Items for office and stationery needs.' },
    { _id: 'cat004', name: 'Books', description: 'All kinds of books and literature.' },
    { _id: 'cat005', name: 'Home Goods', description: 'Household items and decor.' },
];

function CategoryListPage() {
    const { isAuthenticated, loading: authLoading, token } = useAuth();
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [errorCategories, setErrorCategories] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // State for the Confirmation Modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [categoryIdToDelete, setCategoryIdToDelete] = useState(null);

    // Fetch categories from the API
    const fetchCategories = useCallback(async () => {
        setLoadingCategories(true);
        setErrorCategories(null);
        setIsRefreshing(true);

        if (!token) {
            setLoadingCategories(false);
            setIsRefreshing(false);
            setCategories(mockCategories); // Fallback to mock if not authenticated
            return;
        }

        try {
            const response = await API.get('/categories', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data && response.data.length > 0) {
                setCategories(response.data);
                showTimedMessage('Categories loaded successfully!', 2000, 'success');
            } else {
                console.warn('API /categories returned no data. Using mock categories.');
                showTimedMessage('No categories from API. Using default mock data.', 4000, 'info');
                setCategories(mockCategories); // Fallback to mock if API returns empty
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            setErrorCategories(err.response?.data?.message || 'Failed to load categories. Please try again.');
            showTimedMessage(err.response?.data?.message || 'Failed to load categories.', 5000, 'error');
            setCategories(mockCategories); // Fallback to mock on error
        } finally {
            setLoadingCategories(false);
            setIsRefreshing(false);
        }
    }, [token, showTimedMessage]);

    // Function to open the confirmation modal for deletion
    const openDeleteConfirmation = (categoryId) => {
        setCategoryIdToDelete(categoryId);
        setIsConfirmModalOpen(true);
    };

    // Function to handle actual deletion after confirmation
    const confirmDeleteCategory = async () => {
        setIsConfirmModalOpen(false); // Close the confirmation modal
        if (!categoryIdToDelete) return;

        showTimedMessage('Deleting category...', 1500, 'info');
        try {
            await API.delete(`/categories/${categoryIdToDelete}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCategories(prev => prev.filter(cat => cat._id !== categoryIdToDelete)); // Use _id for backend
            showTimedMessage('Category deleted successfully!', 3000, 'success');
        } catch (err) {
            console.error('Failed to delete category:', err);
            showTimedMessage(err.response?.data?.message || 'Failed to delete category. Please try again.', 5000, 'error');
        } finally {
            setCategoryIdToDelete(null);
        }
    };

    // Function to cancel deletion
    const cancelDeleteCategory = () => {
        setIsConfirmModalOpen(false);
        setCategoryIdToDelete(null);
        showTimedMessage('Category deletion cancelled.', 2000, 'info');
    };

    // Navigate to Add Category Page
    const navigateToAddCategory = () => {
        navigate('/categories/add');
    };

    // Navigate to Edit Category Page
    const navigateToEditCategory = (categoryId) => {
        navigate(`/categories/edit/${categoryId}`);
    };

    // Initial fetch on component mount and when authentication state changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchCategories();
        }
    }, [isAuthenticated, fetchCategories]);

    // Filter categories based on search term
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="flex items-center space-x-3 text-lg font-medium text-blue-600 dark:text-blue-300">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading categories page...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <p className="text-red-600 dark:text-red-300">You need to be logged in to view categories.</p>;
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
                            <LayoutList className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-blue-800 dark:text-white">Category Management</h1>
                            <p className="text-blue-700 mt-1 dark:text-blue-200">Organize your products with categories</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <button
                            onClick={navigateToAddCategory}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2"
                        >
                            <PlusCircle className="w-4 h-4" /> Add New Category
                        </button>
                        <button
                            onClick={fetchCategories}
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

                {errorCategories && (
                    <div className="p-4 mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center">
                        <p>{errorCategories}</p>
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
                            placeholder="Search by category name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'}
                            `}
                        />
                    </div>
                </div>

                {/* Categories Table */}
                <div className={`overflow-x-auto rounded-xl shadow-md border transition-colors duration-300
                    ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                `}>
                    {loadingCategories ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-3 text-gray-600 dark:text-blue-200">Loading categories...</span>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="p-8 text-center text-gray-600 dark:text-gray-300">
                            No categories found matching your criteria.
                            <button onClick={navigateToAddCategory} className="ml-2 text-blue-500 hover:underline">Add one?</button>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tl-xl">
                                        Category Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Description
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Created At
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tr-xl">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredCategories.map((category) => (
                                    <tr key={category._id} className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors duration-150`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {category.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                                            {category.description || 'No description'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {new Date(category.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigateToEditCategory(category._id)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-3 transition-colors"
                                                title="Edit Category"
                                            >
                                                <Edit className="w-5 h-5 inline-block" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteConfirmation(category._id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                                                title="Delete Category"
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
                onClose={cancelDeleteCategory}
                onConfirm={confirmDeleteCategory}
                message="Are you sure you want to delete this category? This action cannot be undone."
                title="Confirm Category Deletion"
            />
        </div>
    );
}

export default CategoryListPage;
