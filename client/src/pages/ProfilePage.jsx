import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { User, Edit, Key, Eye, EyeOff, Save, RefreshCw, Image as ImageIcon, Settings } from 'lucide-react'; // Import Settings icon

function ProfilePage() {
    const { isAuthenticated, loading: authLoading, token, user: authUser, login, logout } = useAuth();
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [errorProfile, setErrorProfile] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Edit Profile States
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editImage, setEditImage] = useState('');
    // NEW: Notification Preferences States
    const [receiveLowStockAlerts, setReceiveLowStockAlerts] = useState(false);
    const [lowStockAlertEmail, setLowStockAlertEmail] = useState('');

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    // Change Password States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    // Fetch user profile data
    const fetchUserProfile = useCallback(async () => {
        setLoadingProfile(true);
        setErrorProfile(null);
        setIsRefreshing(true);

        if (!token) {
            setLoadingProfile(false);
            setIsRefreshing(false);
            showTimedMessage('Authentication required to fetch profile.', 3000, 'error');
            return;
        }

        try {
            // Assuming /auth/profile returns the full user object including notificationPreferences
            const response = await API.get('/auth/profile', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const userData = response.data;
            setProfileData(userData);
            setEditName(userData.name);
            setEditEmail(userData.email);
            setEditAddress(userData.address || '');
            setEditImage(userData.image || '');
            // NEW: Set notification preferences states
            setReceiveLowStockAlerts(userData.notificationPreferences?.receiveLowStockAlerts || false);
            setLowStockAlertEmail(userData.notificationPreferences?.lowStockAlertEmail || userData.email || '');

            showTimedMessage('Profile loaded successfully!', 2000, 'success');
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            setErrorProfile(err.response?.data?.message || 'Failed to load profile. Please try again.');
            showTimedMessage(err.response?.data?.message || 'Failed to load profile.', 5000, 'error');
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                navigate('/login');
            }
        } finally {
            setLoadingProfile(false);
            setIsRefreshing(false);
        }
    }, [token, showTimedMessage, logout, navigate]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchUserProfile();
        } else if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, fetchUserProfile, navigate]);

    // Handle Profile Update
    const handleProfileUpdate = useCallback(async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setErrorProfile(null);

        if (!editName.trim() || !editEmail.trim()) {
            showTimedMessage('Name and Email are required.', 3000, 'error');
            setSavingProfile(false);
            return;
        }

        // Validate lowStockAlertEmail only if alerts are enabled
        if (receiveLowStockAlerts && !lowStockAlertEmail.trim()) {
            showTimedMessage('Alert Email Address is required when low stock alerts are enabled.', 3000, 'error');
            setSavingProfile(false);
            return;
        }


        try {
            const response = await API.put('/auth/profile', {
                name: editName.trim(),
                email: editEmail.trim(),
                address: editAddress.trim(),
                image: editImage.trim(), // Ensure image is sent
                // NEW: Include notification preferences in the payload
                notificationPreferences: {
                    receiveLowStockAlerts: receiveLowStockAlerts,
                    lowStockAlertEmail: lowStockAlertEmail.trim(),
                },
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setProfileData(response.data); // Update local profileData with response
            showTimedMessage(response.data.message || 'Profile updated successfully!', 3000, 'success');
            setIsEditingProfile(false);
        } catch (err) {
            console.error('Failed to update profile:', err);
            setErrorProfile(err.response?.data?.message || 'Failed to update profile. Please try again.');
            showTimedMessage(err.response?.data?.message || 'Failed to update profile.', 5000, 'error');
        } finally {
            setSavingProfile(false);
        }
    }, [editName, editEmail, editAddress, editImage, receiveLowStockAlerts, lowStockAlertEmail, token, showTimedMessage]);

    // Handle Password Change
    const handlePasswordChange = useCallback(async (e) => {
        e.preventDefault();
        setSavingPassword(true);
        setErrorProfile(null);

        if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
            showTimedMessage('Please fill all password fields.', 3000, 'error');
            setSavingPassword(false);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showTimedMessage('New passwords do not match.', 3000, 'error');
            setSavingPassword(false);
            return;
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (!passwordRegex.test(newPassword)) {
            showTimedMessage(
                'New password must be at least 8 characters long, contain at least one number, and at least one symbol (!@#$%^&*).',
                5000,
                'error'
            );
            setSavingPassword(false);
            return;
        }

        try {
            await API.put('/auth/password', {
                currentPassword,
                newPassword,
                confirmNewPassword,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            showTimedMessage('Password updated successfully! Please log in with your new password.', 5000, 'success');
            logout();
            navigate('/login');
        } catch (err) {
            console.error('Failed to change password:', err);
            setErrorProfile(err.response?.data?.message || 'Failed to change password. Please try again.', 5000, 'error');
        } finally {
            setSavingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        }
    }, [currentPassword, newPassword, confirmNewPassword, token, showTimedMessage, logout, navigate]);


    if (authLoading || loadingProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="flex items-center space-x-3 text-lg font-medium text-blue-600 dark:text-blue-300">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading profile...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !profileData) {
        return <p className="text-red-600 dark:text-red-300">You need to be logged in to view your profile.</p>;
    }

    // Function to handle image error (e.g., broken URL)
    const handleImageError = (e) => {
        e.target.onerror = null; // Prevent infinite loop
        e.target.src = 'https://placehold.co/100x100/cccccc/ffffff?text=User'; // Fallback to default placeholder
    };

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
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-blue-800 dark:text-white">My Profile</h1>
                            <p className="text-blue-700 mt-1 dark:text-blue-200">View and manage your account details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <button
                            onClick={fetchUserProfile}
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

                {errorProfile && (
                    <div className="p-4 mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center">
                        <p>{errorProfile}</p>
                    </div>
                )}

                {/* Profile Display and Edit Section */}
                <div className={`mb-8 p-6 rounded-xl shadow-md border transition-colors duration-300
                    ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                `}>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center">
                            <User className="w-6 h-6 mr-2 text-purple-500" /> Account Details
                        </h2>
                        <button
                            onClick={() => setIsEditingProfile(prev => !prev)}
                            className="bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-600 transition-colors duration-200 flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" /> {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                        </button>
                    </div>

                    {!isEditingProfile ? (
                        // View Mode
                        <div className="space-y-3 text-gray-700 dark:text-gray-300">
                            <div className="flex items-center space-x-4 mb-4">
                                <img
                                    src={profileData.image || 'https://placehold.co/100x100/cccccc/ffffff?text=User'}
                                    alt="User Profile"
                                    className="rounded-full w-24 h-24 object-cover border-4 border-blue-300 dark:border-blue-700 shadow-lg"
                                    onError={handleImageError}
                                />
                                <div>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{profileData.name}</p>
                                    <p className="text-md text-gray-600 dark:text-gray-400 capitalize">Role: {profileData.role}</p>
                                </div>
                            </div>
                            <p><strong>Email:</strong> {profileData.email}</p>
                            <p><strong>Address:</strong> {profileData.address || 'Not provided'}</p>
                            <p>
                                <strong>Member Since:</strong>{' '}
                                {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                            {/* Display Notification Preferences in View Mode */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center mb-2">
                                    <Settings className="w-5 h-5 mr-2 text-blue-500" /> Notification Settings
                                </h3>
                                <p>
                                    <strong>Low Stock Alerts:</strong>{' '}
                                    {receiveLowStockAlerts ? `Enabled (to ${lowStockAlertEmail || profileData.email})` : 'Disabled'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        // Edit Mode
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div>
                                <label htmlFor="editName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Name</label>
                                <input
                                    type="text"
                                    id="editName"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                        ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                    `}
                                />
                            </div>
                            <div>
                                <label htmlFor="editEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
                                <input
                                    type="email"
                                    id="editEmail"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    required
                                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                        ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                    `}
                                />
                            </div>
                            <div>
                                <label htmlFor="editAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Address</label>
                                <textarea
                                    id="editAddress"
                                    value={editAddress}
                                    onChange={(e) => setEditAddress(e.target.value)}
                                    rows="3"
                                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                        ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                    `}
                                ></textarea>
                            </div>
                            {/* Image URL input */}
                            <div>
                                <label htmlFor="editImage" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Profile Image URL (Optional)</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="url"
                                        id="editImage"
                                        value={editImage}
                                        onChange={(e) => setEditImage(e.target.value)}
                                        placeholder="e.g., https://example.com/your-pic.jpg"
                                        className={`flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                            ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                        `}
                                    />
                                    <img
                                        src={editImage || 'https://placehold.co/40x40/cccccc/ffffff?text=Img'}
                                        alt="Image Preview"
                                        className="w-10 h-10 rounded-full object-cover border border-gray-300"
                                        onError={handleImageError}
                                    />
                                    <ImageIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Provide a direct link to an image. Leave blank for default.</p>
                            </div>

                            {/* NEW: Notification Preferences Section in Edit Mode */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                                    <Settings className="w-5 h-5 mr-2 text-blue-500" /> Notification Preferences
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="receiveLowStockAlerts"
                                            checked={receiveLowStockAlerts}
                                            onChange={(e) => setReceiveLowStockAlerts(e.target.checked)}
                                            className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500
                                                ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : ''}
                                            `}
                                        />
                                        <label htmlFor="receiveLowStockAlerts" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Receive Low Stock Alerts
                                        </label>
                                    </div>
                                    {receiveLowStockAlerts && (
                                        <div>
                                            <label htmlFor="lowStockAlertEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alert Email Address</label>
                                            <input
                                                type="email"
                                                id="lowStockAlertEmail"
                                                value={lowStockAlertEmail}
                                                onChange={(e) => setLowStockAlertEmail(e.target.value)}
                                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500
                                                    ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                                `}
                                                required={receiveLowStockAlerts}
                                            />
                                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Notifications will be sent to this email address.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="w-auto mx-auto flex items-center justify-center bg-green-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-green-700 transition-all duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {savingProfile ? (
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <Save className="w-5 h-5 mr-2" />
                                )}
                                {savingProfile ? 'Saving Profile...' : 'Save Changes'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Change Password Section */}
                <div className={`p-6 rounded-xl shadow-md border transition-colors duration-300
                    ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                `}>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white flex items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                        <Key className="w-6 h-6 mr-2 text-red-500" /> Change Password
                    </h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="relative">
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Current Password</label>
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                required
                                autoComplete="current-password"
                                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10
                                    ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                `}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(prev => !prev)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center pt-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                title={showCurrentPassword ? 'Hide password' : 'Show password'}
                            >
                                {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        <div className="relative">
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">New Password</label>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min 8 chars, 1 num, 1 symbol"
                                required
                                autoComplete="new-password"
                                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10
                                    ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                `}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(prev => !prev)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center pt-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                title={showNewPassword ? 'Hide password' : 'Show password'}
                            >
                                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        <div className="relative">
                            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Confirm New Password</label>
                            <input
                                type={showConfirmNewPassword ? 'text' : 'password'}
                                id="confirmNewPassword"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                required
                                autoComplete="new-password"
                                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10
                                    ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}
                                `}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmNewPassword(prev => !prev)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center pt-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                title={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                            >
                                {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={savingPassword}
                                className="w-auto mx-auto flex items-center justify-center bg-red-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-red-700 transition-all duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {savingPassword ? (
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <Key className="w-5 h-5 mr-2" />
                                )}
                                {savingPassword ? 'Changing Password...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
