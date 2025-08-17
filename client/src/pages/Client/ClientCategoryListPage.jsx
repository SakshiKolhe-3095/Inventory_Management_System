// client/src/pages/Client/ClientCategoryListPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNotification } from '../../components/Notification.jsx';
import API from '../../api/axios.js';
import { Tag, Search, RefreshCw, Loader2 } from 'lucide-react';

function ClientCategoryListPage() {
    const { isAuthenticated, loading: authLoading, isClient, token } = useAuth();
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [errorCategories, setErrorCategories] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch categories from the API
    const fetchCategories = useCallback(async () => {
        console.log('ClientCategoryListPage: fetchCategories called. isAuthenticated:', isAuthenticated, 'isClient:', isClient, 'token exists:', !!token);
        setLoadingCategories(true);
        setErrorCategories(null);
        setIsRefreshing(true);

        if (!isAuthenticated || !token) {
            console.log('ClientCategoryListPage: Not authenticated or token missing. Skipping API call.');
            setLoadingCategories(false);
            setIsRefreshing(false);
            setCategories([]);
            showTimedMessage('Authentication required to view categories.', 3000, 'error');
            return;
        }

        try {
            console.log('ClientCategoryListPage: Attempting to fetch categories from /api/categories...');
            const response = await API.get('/categories', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('ClientCategoryListPage: API response received:', response.data);

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setCategories(response.data);
                showTimedMessage('Categories loaded successfully!', 2000, 'success');
            } else {
                console.warn('ClientCategoryListPage: API /categories returned no data or invalid format. Setting categories to empty array.');
                showTimedMessage('No categories available.', 4000, 'info');
                setCategories([]);
            }
        } catch (err) {
            console.error('ClientCategoryListPage: Failed to fetch categories:', err);
            setErrorCategories(err.response?.data?.message || 'Failed to load categories. Please try again.');
            showTimedMessage(err.response?.data?.message || 'Failed to load categories.', 5000, 'error');
            setCategories([]);
        } finally {
            setLoadingCategories(false);
            setIsRefreshing(false);
        }
    }, [isAuthenticated, isClient, token, showTimedMessage]);

    // Initial fetch on component mount and when authentication state changes
    useEffect(() => {
        console.log('ClientCategoryListPage useEffect triggered. authLoading:', authLoading, 'isAuthenticated:', isAuthenticated, 'isClient:', isClient);
        if (!authLoading) {
            if (!isAuthenticated || !isClient) {
                console.log('ClientCategoryListPage: User not authenticated or not a client. Redirecting to login.');
                navigate('/login');
            } else {
                console.log('ClientCategoryListPage: User is authenticated and is a client. Calling fetchCategories.');
                fetchCategories();
            }
        }
    }, [isAuthenticated, authLoading, isClient, fetchCategories, navigate]);

    // Filter categories based on search term
    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || loadingCategories) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="flex items-center space-x-3 text-lg font-medium text-blue-600 dark:text-blue-300">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading categories for client...</span>
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
                            <Tag className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-blue-800 dark:text-white">Product Categories</h1>
                            <p className="text-blue-700 mt-1 dark:text-blue-200">Browse available product categories.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
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
                            <Loader2 className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></Loader2>
                            <span className="ml-3 text-gray-600 dark:text-blue-200">Loading categories...</span>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="p-8 text-center text-gray-600 dark:text-gray-300">
                            No categories found matching your criteria.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tl-xl">
                                        ID
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Category Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Description
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tr-xl">
                                        Created At
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredCategories.map((category) => (
                                    <tr key={category._id} className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors duration-150`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {category._id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {category.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                            {category.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {new Date(category.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ClientCategoryListPage;
