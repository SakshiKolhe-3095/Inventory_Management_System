// client/src/pages/EditUserPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { Edit, ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';

function EditUserPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, token, loadingAuthState, user: currentUser } = useAuth();
    const { showTimedMessage } = useNotification();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Optional new password
    const [confirmPassword, setConfirmPassword] = useState('');
    const [address, setAddress] = useState('');
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // State for password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Redirect if not authenticated or not admin
    useEffect(() => {
        if (!loadingAuthState && (!isAuthenticated || currentUser?.role !== 'admin')) {
            showTimedMessage('You are not authorized to access this page.', 3000, 'error');
            navigate('/admin/dashboard'); // Redirect to admin dashboard or login
        }
    }, [loadingAuthState, isAuthenticated, token, currentUser, navigate, showTimedMessage]);

    // Fetch single user for the edit form
    const fetchUser = useCallback(async () => {
        if (!token || !id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await API.get(`/users/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const userData = response.data;
            setName(userData.name);
            setEmail(userData.email);
            setAddress(userData.address || '');
            setRole(userData.role);
        } catch (err) {
            console.error('Error fetching user:', err);
            setError(err.response?.data?.message || 'Failed to load user.');
            showTimedMessage(err.response?.data?.message || 'Failed to load user.', 5000, 'error');
            if (err.response?.status === 404 || err.response?.status === 403) {
                navigate('/users'); // Redirect if user not found or unauthorized
            }
        } finally {
            setLoading(false);
        }
    }, [id, token, navigate, showTimedMessage]);

    useEffect(() => {
        if (!loadingAuthState && isAuthenticated && currentUser?.role === 'admin') {
            fetchUser();
        }
    }, [loadingAuthState, isAuthenticated, currentUser, fetchUser]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!token) {
            showTimedMessage('Authentication required.', 3000);
            return;
        }

        if (!name.trim() || !email.trim() || !address.trim() || !role.trim()) {
            showTimedMessage('Please fill all required fields: Name, Email, Address, and Role.', 3000, 'error');
            return;
        }

        // --- New Password Validation (only if password field is not empty) ---
        if (password) { // Only validate if a new password is being entered
            if (password !== confirmPassword) {
                showTimedMessage('New passwords do not match.', 3000, 'error');
                return;
            }
            const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
            if (!passwordRegex.test(password)) {
                showTimedMessage(
                    'New password must be at least 8 characters long, contain at least one number, and at least one symbol (!@#$%^&*).',
                    5000,
                    'error'
                );
                return;
            }
        }
        // --- End New Password Validation ---

        // Prevent admin from changing their own role
        if (currentUser && currentUser.id === id && role !== currentUser.role) {
            showTimedMessage('You cannot change your own role through this interface.', 4000, 'error');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const updatedUser = {
                name: name.trim(),
                email: email.trim(),
                address: address.trim(),
                role: role.trim(),
            };
            if (password) { // Only include password if it's being updated
                updatedUser.password = password.trim();
            }

            await API.put(`/users/${id}`, updatedUser, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            showTimedMessage('User updated successfully!', 3000, 'success');
            navigate('/users'); // Redirect to user list
        } catch (err) {
            console.error('Error updating user:', err);
            setError(err.response?.data?.message || 'Failed to update user.');
            showTimedMessage(err.response?.data?.message || 'Failed to update user.', 5000, 'error');
        } finally {
            setIsSaving(false);
        }
    }, [id, name, email, password, confirmPassword, address, role, token, navigate, showTimedMessage, currentUser]);

    if (loadingAuthState || (isAuthenticated && currentUser?.role !== 'admin' && loading)) {
        return (
            <div className="flex items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-300">
                <p className="text-indigo-600 dark:text-indigo-300">Loading user data...</p>
            </div>
        );
    }

    if (error && !name) { // Only show error if we failed to load data initially
        return (
            <div className="flex items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-300">
                <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 dark:shadow-none transition-colors duration-300">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/users')}
                    className="mr-3 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                    title="Back to User Management"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-3xl font-bold text-indigo-700 flex items-center dark:text-indigo-300">
                    <Edit className="w-8 h-8 mr-3 text-purple-500 dark:text-purple-300" />
                    Edit User: {name}
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
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Jane Doe"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g., jane.doe@example.com"
                        required
                        autoComplete="off" // Prevent autofill
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
                {/* New Password Field with Toggle */}
                <div className="relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">New Password (Optional)</label>
                    <input
                        type={showPassword ? 'text' : 'password'} // Toggle type
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password (min 8 chars, 1 num, 1 symbol)"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-10"
                        autoComplete="new-password" // Prevent autofill
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(prev => !prev)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center pt-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                {/* Confirm New Password Field with Toggle */}
                <div className="relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Confirm New Password</label>
                    <input
                        type={showConfirmPassword ? 'text' : 'password'} // Toggle type
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-10"
                        autoComplete="new-password" // Prevent autofill
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center pt-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Address</label>
                    <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g., 456 Oak Ave, Townsville"
                        required
                        rows="3"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Role</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        disabled={currentUser && currentUser.id === id}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                    </select>
                    {currentUser && currentUser.id === id && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">You cannot change your own role.</p>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={isSaving}
                    // Fix: Changed w-full to w-fit and added mx-auto for centering
                    className="w-fit mx-auto flex items-center justify-center bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-indigo-700 transition-all duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <Save className="w-5 h-5 mr-2" />
                    )}
                    {isSaving ? 'Updating User...' : 'Update User'}
                </button>
            </form>
        </div>
    );
}

export default EditUserPage;