// client/src/pages/UserListPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { Users, PlusCircle, Edit, Trash2, Search, RefreshCw } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal.jsx';

function UserListPage() {
    const { isAuthenticated, loading: authLoading, token, user: currentUser } = useAuth(); // Renamed user to currentUser
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [errorUsers, setErrorUsers] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // State for the Confirmation Modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [userIdToDelete, setUserIdToDelete] = useState(null);
    const [userNameToDelete, setUserNameToDelete] = useState('');

    // Fetch users from the API
    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        setErrorUsers(null);
        setIsRefreshing(true);

        if (!token) {
            setLoadingUsers(false);
            setIsRefreshing(false);
            showTimedMessage('Authentication required to fetch users.', 3000, 'error');
            return;
        }

        try {
            const response = await API.get('/users', { // API endpoint for user management
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUsers(response.data);
            showTimedMessage('Users loaded successfully!', 2000, 'success');
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setErrorUsers(err.response?.data?.message || 'Failed to load users. Please try again.');
            showTimedMessage(err.response?.data?.message || 'Failed to load users.', 5000, 'error');
        } finally {
            setLoadingUsers(false);
            setIsRefreshing(false);
        }
    }, [token, showTimedMessage]);

    // Function to open the confirmation modal for deletion
    const openDeleteConfirmation = (userId, userName) => {
        // Prevent deleting self
        if (currentUser && currentUser.id === userId) {
            showTimedMessage('You cannot delete your own account through this interface.', 4000, 'error');
            return;
        }
        setUserIdToDelete(userId);
        setUserNameToDelete(userName);
        setIsConfirmModalOpen(true);
    };

    // Function to handle actual deletion after confirmation
    const confirmDeleteUser = async () => {
        setIsConfirmModalOpen(false); // Close the confirmation modal
        if (!userIdToDelete) return;

        showTimedMessage(`Deleting user "${userNameToDelete}"...`, 1500, 'info');
        try {
            await API.delete(`/users/${userIdToDelete}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUsers(prev => prev.filter(u => u._id !== userIdToDelete));
            showTimedMessage(`User "${userNameToDelete}" deleted successfully!`, 3000, 'success');
        } catch (err) {
            console.error('Failed to delete user:', err);
            showTimedMessage(err.response?.data?.message || 'Failed to delete user. Please try again.', 5000, 'error');
        } finally {
            setUserIdToDelete(null);
            setUserNameToDelete('');
        }
    };

    // Function to cancel deletion
    const cancelDeleteUser = () => {
        setIsConfirmModalOpen(false);
        setUserIdToDelete(null);
        setUserNameToDelete('');
        showTimedMessage('User deletion cancelled.', 2000, 'info');
    };

    // Navigate to Add User Page
    const navigateToAddUser = () => {
        navigate('/users/add');
    };

    // Navigate to Edit User Page
    const navigateToEditUser = (userId) => {
        navigate(`/users/edit/${userId}`);
    };

    // Initial fetch on component mount and when authentication state changes
    useEffect(() => {
        // Only fetch users if authenticated and current user is an admin
        if (isAuthenticated && currentUser?.role === 'admin') {
            fetchUsers();
        } else if (!authLoading && (!isAuthenticated || currentUser?.role !== 'admin')) {
            // If not admin, redirect or show unauthorized message
            showTimedMessage('You are not authorized to view this page.', 3000, 'error');
            navigate('/admin/dashboard'); // Redirect to a safe page
        }
    }, [isAuthenticated, currentUser, authLoading, fetchUsers, navigate, showTimedMessage]);

    // Filter users based on search term
    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || (isAuthenticated && currentUser?.role !== 'admin' && users.length === 0)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="flex items-center space-x-3 text-lg font-medium text-blue-600 dark:text-blue-300">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading user management page...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || currentUser?.role !== 'admin') {
        // This state should ideally be caught by the useEffect redirect,
        // but as a fallback, explicitly render unauthorized message.
        return <p className="text-red-600 dark:text-red-300 p-6">Access Denied: You must be an administrator to view this page.</p>;
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
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-blue-800 dark:text-white">User Management</h1>
                            <p className="text-blue-700 mt-1 dark:text-blue-200">Manage user accounts and roles</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <button
                            onClick={navigateToAddUser}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2"
                        >
                            <PlusCircle className="w-4 h-4" /> Add New User
                        </button>
                        <button
                            onClick={fetchUsers}
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

                {errorUsers && (
                    <div className="p-4 mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center">
                        <p>{errorUsers}</p>
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
                            placeholder="Search by name, email, or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'}
                            `}
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className={`overflow-x-auto rounded-xl shadow-md border transition-colors duration-300
                    ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                `}>
                    {loadingUsers ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-3 text-gray-600 dark:text-blue-200">Loading users...</span>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-600 dark:text-gray-300">
                            No users found matching your criteria.
                            <button onClick={navigateToAddUser} className="ml-2 text-blue-500 hover:underline">Add one?</button>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tl-xl">
                                        S.No.
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Role
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
                                {filteredUsers.map((user, index) => (
                                    <tr key={user._id} className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors duration-150`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}
                                            `}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigateToEditUser(user._id)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-3 transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit className="w-5 h-5 inline-block" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteConfirmation(user._id, user.name)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                                                title="Delete User"
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
                onClose={cancelDeleteUser}
                onConfirm={confirmDeleteUser}
                message={`Are you sure you want to delete user "${userNameToDelete}"? This action cannot be undone.`}
                title="Confirm User Deletion"
            />
        </div>
    );
}

export default UserListPage;
