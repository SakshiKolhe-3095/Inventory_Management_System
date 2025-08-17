// client/src/pages/AddUserPage.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { PlusCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

function AddUserPage() {
    const { isAuthenticated, token, loadingAuthState, user: currentUser } = useAuth();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [address, setAddress] = useState('');
    const [role, setRole] = useState('client'); // Default role to 'client'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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


    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!token) {
            showTimedMessage('Authentication required.', 3000);
            return;
        }

        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !address.trim() || !role.trim()) {
            showTimedMessage('Please fill all required fields.', 3000, 'error');
            return;
        }

        if (password !== confirmPassword) {
            showTimedMessage('Passwords do not match.', 3000, 'error');
            return;
        }

        // --- New Password Validation ---
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (!passwordRegex.test(password)) {
            showTimedMessage(
                'Password must be at least 8 characters long, contain at least one number, and at least one symbol (!@#$%^&*).',
                5000,
                'error'
            );
            return;
        }
        // --- End New Password Validation ---

        setLoading(true);
        setError(null);

        try {
            const newUser = {
                name: name.trim(),
                email: email.trim(),
                password: password.trim(),
                address: address.trim(),
                role: role.trim(),
            };
            await API.post('/users', newUser, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            showTimedMessage('User added successfully!', 3000, 'success');
            navigate('/users'); // Redirect to user list
        } catch (err) {
            console.error('Error adding user:', err);
            setError(err.response?.data?.message || 'Failed to add user.');
            showTimedMessage(err.response?.data?.message || 'Failed to add user.', 5000, 'error');
        } finally {
            setLoading(false);
        }
    }, [name, email, password, confirmPassword, address, role, token, navigate, showTimedMessage]);

    if (loadingAuthState || (isAuthenticated && currentUser?.role !== 'admin')) {
        return (
            <div className="flex items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-300">
                <p className="text-indigo-600 dark:text-indigo-300">Loading...</p>
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
                    <PlusCircle className="w-8 h-8 mr-3 text-purple-500 dark:text-purple-300" />
                    Add New User
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
                        placeholder="Enter User Name"
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
                        placeholder="Enter E-Mail ID"
                        required
                        autoComplete="off" // Prevent autofill
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-10"
                    />
                </div>
                {/* Password Field with Toggle */}
                <div className="relative">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Password</label>
                    <input
                        type={showPassword ? 'text' : 'password'} // Toggle type
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password (min 8 chars, 1 num, 1 symbol)"
                        required
                        autoComplete="new-password" // Prevent autofill
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-10"
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
                {/* Confirm Password Field with Toggle */}
                <div className="relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Confirm Password</label>
                    <input
                        type={showConfirmPassword ? 'text' : 'password'} // Toggle type
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        autoComplete="new-password" // Prevent autofill
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pr-10"
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
                        placeholder="Enter User Address"
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="client">Client</option>
                        <option value="admin">Admin</option>
                    </select>
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
                    {loading ? 'Adding User...' : 'Add User'}
                </button>
            </form>
        </div>
    );
}

export default AddUserPage;
