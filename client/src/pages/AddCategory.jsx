// client/src/pages/AddCategory.jsx

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { PlusCircle, ArrowLeft } from 'lucide-react';

function AddCategoryPage() {
    const { token, loadingAuthState } = useAuth();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!token) {
            showTimedMessage('You must be logged in to add a category.', 3000);
            return;
        }
        if (!name.trim()) {
            showTimedMessage('Category name is required.', 3000);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const newCategory = {
                name: name.trim(),
                description: description.trim(),
            };
            await API.post('/categories', newCategory, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            showTimedMessage('Category added successfully!', 3000, 'success');
            navigate('/categories'); // Redirect to category list
        } catch (err) {
            console.error('Error adding category:', err);
            setError(err.response?.data?.message || 'Failed to add category.');
            showTimedMessage(err.response?.data?.message || 'Failed to add category.', 5000, 'error');
        } finally {
            setLoading(false);
        }
    }, [name, description, token, navigate, showTimedMessage]);

    if (loadingAuthState) {
        return (
            <div className="flex items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-300">
                <p className="text-indigo-600 dark:text-indigo-300">Loading authentication state...</p>
            </div>
        );
    }

    // This page should be protected by PrivateRoute in App.jsx,
    // so no explicit isAuthenticated check is strictly needed here,
    // but the `token` check in handleSubmit is good.

    return (
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:shadow-none transition-colors duration-300">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/categories')}
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

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Category Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Sheet Metal Parts"
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
                        placeholder="A brief description of this category"
                        rows="3"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    ></textarea>
                </div>
                <button
                    type="submit"
                    disabled={loading}
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
                    {loading ? 'Adding Category...' : 'Add Category'}
                </button>
            </form>
        </div>
    );
}

export default AddCategoryPage;
