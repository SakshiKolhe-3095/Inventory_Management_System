// client/src/pages/EditSupplier.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { Edit, ArrowLeft, Save } from 'lucide-react';

function EditSupplierPage() {
    const { id } = useParams(); // Get supplier ID from URL
    const navigate = useNavigate();
    const { token, loadingAuthState } = useAuth();
    const { showTimedMessage } = useNotification();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(true); // Start loading to fetch supplier data
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch single supplier for the edit form
    const fetchSupplier = useCallback(async () => {
        if (!token || !id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await API.get(`/suppliers/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const supplierData = response.data;
            setName(supplierData.name);
            setEmail(supplierData.email || ''); // Keep default for initial load if null/undefined
            setPhone(supplierData.phone || '');
            setAddress(supplierData.address || '');
        } catch (err) {
            console.error('Error fetching supplier:', err);
            setError(err.response?.data?.message || 'Failed to load supplier.');
            showTimedMessage(err.response?.data?.message || 'Failed to load supplier.', 5000, 'error');
            if (err.response?.status === 404 || err.response?.status === 403) {
                navigate('/suppliers'); // Redirect if supplier not found or unauthorized
            }
        } finally {
            setLoading(false);
        }
    }, [id, token, navigate, showTimedMessage]);

    useEffect(() => {
        if (!loadingAuthState) {
            fetchSupplier();
        }
    }, [loadingAuthState, fetchSupplier]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!token) {
            showTimedMessage('You must be logged in to edit a supplier.', 3000);
            return;
        }
        // Updated validation to make all fields compulsory
        if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
            showTimedMessage('Please fill all required fields: Name, Email, Phone, and Address.', 3000);
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const updatedSupplier = {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                address: address.trim(),
            };
            await API.put(`/suppliers/${id}`, updatedSupplier, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            showTimedMessage('Supplier updated successfully!', 3000, 'success');
            navigate('/suppliers'); // Redirect to supplier list
        } catch (err) {
            console.error('Error updating supplier:', err);
            setError(err.response?.data?.message || 'Failed to update supplier.');
            showTimedMessage(err.response?.data?.message || 'Failed to update supplier.', 5000, 'error');
        } finally {
            setIsSaving(false);
        }
    }, [id, name, email, phone, address, token, navigate, showTimedMessage]);

    if (loadingAuthState || loading) {
        return (
            <div className="flex items-center justify-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-300">
                <p className="text-indigo-600 dark:text-indigo-300">Loading supplier data...</p>
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
                    onClick={() => navigate('/suppliers')}
                    className="mr-3 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                    title="Back to Suppliers"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-3xl font-bold text-indigo-700 flex items-center dark:text-indigo-300">
                    <Edit className="w-8 h-8 mr-3 text-purple-500 dark:text-purple-300" />
                    Edit Supplier: {name}
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
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Supplier Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Tech Solutions Inc."
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label> {/* Removed (Optional) */}
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g., contact@example.com"
                        required 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Phone</label> {/* Removed (Optional) */}
                    <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g., +1234567890"
                        required 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Address</label> {/* Removed (Optional) */}
                    <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g., 123 Main St, City, Country"
                        rows="3"
                        required 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    ></textarea>
                </div>
                <button
                    type="submit"
                    disabled={isSaving}
                    // Changed w-full to w-fit and added mx-auto for centering
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
                    {isSaving ? 'Updating Supplier...' : 'Update Supplier'}
                </button>
            </form>
        </div>
    );
}

export default EditSupplierPage;