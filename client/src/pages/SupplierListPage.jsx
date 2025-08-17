// client/src/pages/SupplierListPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNotification } from '../components/Notification.jsx';
import API from '../api/axios.js';
import { Truck, PlusCircle, Edit, Trash2, Search, RefreshCw } from 'lucide-react'; // Truck icon for suppliers
import ConfirmationModal from '../components/ConfirmationModal.jsx';

// Mock Supplier Data (as a fallback if API fails or is empty)
const mockSuppliers = [
    { _id: 'sup001', name: 'Global Tech Distributors', email: 'contact@globaltech.com', phone: '123-456-7890', address: '10 Tech Park, Silicon Valley' },
    { _id: 'sup002', name: 'Office Essentials Co.', email: 'sales@officeessentials.net', phone: '987-654-3210', address: '20 Business Rd, City Center' },
    { _id: 'sup003', name: 'Bookworm Wholesale', email: 'info@bookworm.org', phone: '555-111-2222', address: '30 Read St, Booktown' },
];

function SupplierListPage() {
    const { isAuthenticated, loading: authLoading, token } = useAuth();
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();
    const navigate = useNavigate();

    const [suppliers, setSuppliers] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [errorSuppliers, setErrorSuppliers] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // State for the Confirmation Modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [supplierIdToDelete, setSupplierIdToDelete] = useState(null);

    // Fetch suppliers from the API
    const fetchSuppliers = useCallback(async () => {
        setLoadingSuppliers(true);
        setErrorSuppliers(null);
        setIsRefreshing(true);

        if (!token) {
            setLoadingSuppliers(false);
            setIsRefreshing(false);
            setSuppliers(mockSuppliers); // Fallback to mock if not authenticated
            return;
        }

        try {
            const response = await API.get('/suppliers', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data && response.data.length > 0) {
                setSuppliers(response.data);
                showTimedMessage('Suppliers loaded successfully!', 2000, 'success');
            } else {
                console.warn('API /suppliers returned no data. Using mock suppliers.');
                showTimedMessage('No suppliers from API. Using default mock data.', 4000, 'info');
                setSuppliers(mockSuppliers); // Fallback to mock if API returns empty
            }
        } catch (err) {
            console.error('Failed to fetch suppliers:', err);
            setErrorSuppliers(err.response?.data?.message || 'Failed to load suppliers. Please try again.');
            showTimedMessage(err.response?.data?.message || 'Failed to load suppliers.', 5000, 'error');
            setSuppliers(mockSuppliers); // Fallback to mock on error
        } finally {
            setLoadingSuppliers(false);
            setIsRefreshing(false);
        }
    }, [token, showTimedMessage]);

    // Function to open the confirmation modal for deletion
    const openDeleteConfirmation = (supplierId) => {
        setSupplierIdToDelete(supplierId);
        setIsConfirmModalOpen(true);
    };

    // Function to handle actual deletion after confirmation
    const confirmDeleteSupplier = async () => {
        setIsConfirmModalOpen(false); // Close the confirmation modal
        if (!supplierIdToDelete) return;

        showTimedMessage('Deleting supplier...', 1500, 'info');
        try {
            await API.delete(`/suppliers/${supplierIdToDelete}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setSuppliers(prev => prev.filter(sup => sup._id !== supplierIdToDelete)); // Use _id for backend
            showTimedMessage('Supplier deleted successfully!', 3000, 'success');
        } catch (err) {
            console.error('Failed to delete supplier:', err);
            showTimedMessage(err.response?.data?.message || 'Failed to delete supplier. Please try again.', 5000, 'error');
        } finally {
            setSupplierIdToDelete(null);
        }
    };

    // Function to cancel deletion
    const cancelDeleteSupplier = () => {
        setIsConfirmModalOpen(false);
        setSupplierIdToDelete(null);
        showTimedMessage('Supplier deletion cancelled.', 2000, 'info');
    };

    // Navigate to Add Supplier Page
    const navigateToAddSupplier = () => {
        navigate('/suppliers/add');
    };

    // Navigate to Edit Supplier Page
    const navigateToEditSupplier = (supplierId) => {
        navigate(`/suppliers/edit/${supplierId}`);
    };

    // Initial fetch on component mount and when authentication state changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchSuppliers();
        }
    }, [isAuthenticated, fetchSuppliers]);

    // Filter suppliers based on search term (name, email, phone, address)
    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.phone && supplier.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.address && supplier.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
                <div className="flex items-center space-x-3 text-lg font-medium text-blue-600 dark:text-blue-300">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading suppliers page...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <p className="text-red-600 dark:text-red-300">You need to be logged in to view suppliers.</p>;
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
                            <Truck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-blue-800 dark:text-white">Supplier Management</h1>
                            <p className="text-blue-700 mt-1 dark:text-blue-200">Manage your product suppliers</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <button
                            onClick={navigateToAddSupplier}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2"
                        >
                            <PlusCircle className="w-4 h-4" /> Add New Supplier
                        </button>
                        <button
                            onClick={fetchSuppliers}
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

                {errorSuppliers && (
                    <div className="p-4 mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center">
                        <p>{errorSuppliers}</p>
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
                            placeholder="Search by name, email, phone, or address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500'}
                            `}
                        />
                    </div>
                </div>

                {/* Suppliers Table */}
                <div className={`overflow-x-auto rounded-xl shadow-md border transition-colors duration-300
                    ${theme === 'dark' ? 'bg-white bg-opacity-10 border-white border-opacity-20' : 'bg-white border-gray-200'}
                `}>
                    {loadingSuppliers ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-3 text-gray-600 dark:text-blue-200">Loading suppliers...</span>
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="p-8 text-center text-gray-600 dark:text-gray-300">
                            No suppliers found matching your criteria.
                            <button onClick={navigateToAddSupplier} className="ml-2 text-blue-500 hover:underline">Add one?</button>
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
                                        Phone
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                        Address
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 rounded-tr-xl">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredSuppliers.map((supplier, index) => (
                                    <tr key={supplier._id} className={`${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors duration-150`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {supplier.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {supplier.email || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {supplier.phone || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                            {supplier.address || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigateToEditSupplier(supplier._id)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-3 transition-colors"
                                                title="Edit Supplier"
                                            >
                                                <Edit className="w-5 h-5 inline-block" />
                                            </button>
                                            <button
                                                onClick={() => openDeleteConfirmation(supplier._id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors"
                                                title="Delete Supplier"
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
                onClose={cancelDeleteSupplier}
                onConfirm={confirmDeleteSupplier}
                message="Are you sure you want to delete this supplier? This action cannot be undone."
                title="Confirm Supplier Deletion"
            />
        </div>
    );
}

export default SupplierListPage;
