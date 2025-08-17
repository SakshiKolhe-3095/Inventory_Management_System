import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import PrivateRoute from './auth/PrivateRoute.jsx';
import { NotificationProvider } from './components/Notification.jsx';
import Navbar from './components/Navbar.jsx';

// General Pages
import LoginPage from './pages/Login.jsx';
import RegisterPage from './pages/Register.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

// Admin-specific Pages
import ProductListPage from './pages/Products.jsx'; // Admin's Product List
import AddProductPage from './pages/AddProduct.jsx';
import EditProductPage from './pages/EditProduct.jsx';

import CategoryListPage from './pages/CategoryListPage.jsx'; // Admin's Category List
import AddCategoryPage from './pages/AddCategory.jsx';
import EditCategoryPage from './pages/EditCategory.jsx';

import SupplierListPage from './pages/SupplierListPage.jsx';
import AddSupplierPage from './pages/AddSupplier.jsx';
import EditSupplierPage from './pages/EditSupplier.jsx';

import UserListPage from './pages/UserListPage.jsx';
import AddUserPage from './pages/AddUserPage.jsx';
import EditUserPage from './pages/EditUserPage.jsx';

import AdminDashboard from './pages/Admin/AdminDashboard.jsx';

// General Order Pages (Accessible by both Admin and Client for their respective views/actions)
import OrderListPage from './pages/OrderListPage.jsx';
import AddOrderPage from './pages/AddOrder.jsx';
import EditOrderPage from './pages/EditOrder.jsx';

// Client-specific Pages (in client/src/pages/Client/)
import ClientDashboard from './pages/Client/ClientDashboard.jsx';
import ClientProductsPage from './pages/Client/ClientProductsPage.jsx';
import MyOrdersPage from './pages/Client/MyOrdersPage.jsx';
import ClientCategoryListPage from './pages/Client/ClientCategoryListPage.jsx'; // NEW: Client's Category List

// NEW: Import the LowStockReportPage
import LowStockReportPage from './pages/Admin/LowStockReportPage.jsx';


function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <NotificationProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </NotificationProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

function AppContent() {
    const { isAuthenticated, loading: authLoading, user } = useAuth();
    const location = useLocation();

    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="flex items-center space-x-3 text-lg font-medium text-indigo-600 dark:text-indigo-300">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading application...</span>
                </div>
            </div>
        );
    }

    const authRedirectPath = isAuthenticated
        ? user?.role === 'admin'
            ? '/admin/dashboard'
            : user?.role === 'client'
                ? '/client/dashboard'
                : '/login'
        : '/login';

    return (
        <div className="relative">
            {isAuthPage ? (
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/" element={<Navigate to={authRedirectPath} replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            ) : (
                <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-4 font-sans text-gray-800
                                 dark:from-slate-900 dark:via-blue-900 dark:to-slate-800 dark:text-gray-200 transition-colors duration-300">
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>

                    <div className="relative z-10">
                        <Navbar />

                        <div className="mt-6">
                            <Routes>
                                <Route path="/" element={<Navigate to={authRedirectPath} replace />} />

                                {/* Admin-specific Routes */}
                                <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
                                <Route path="/products" element={<PrivateRoute allowedRoles={['admin']}><ProductListPage /></PrivateRoute>} />
                                <Route path="/products/add" element={<PrivateRoute allowedRoles={['admin']}><AddProductPage /></PrivateRoute>} />
                                <Route path="/products/edit/:id" element={<PrivateRoute allowedRoles={['admin']}><EditProductPage /></PrivateRoute>} />
                                <Route path="/categories" element={<PrivateRoute allowedRoles={['admin']}><CategoryListPage /></PrivateRoute>} /> {/* Admin-only categories */}
                                <Route path="/categories/add" element={<PrivateRoute allowedRoles={['admin']}><AddCategoryPage /></PrivateRoute>} />
                                <Route path="/categories/edit/:id" element={<PrivateRoute allowedRoles={['admin']}><EditCategoryPage /></PrivateRoute>} />
                                <Route path="/suppliers" element={<PrivateRoute allowedRoles={['admin']}><SupplierListPage /></PrivateRoute>} />
                                <Route path="/suppliers/add" element={<PrivateRoute allowedRoles={['admin']}><AddSupplierPage /></PrivateRoute>} />
                                <Route path="/suppliers/edit/:id" element={<PrivateRoute allowedRoles={['admin']}><EditSupplierPage /></PrivateRoute>} />
                                <Route path="/users" element={<PrivateRoute allowedRoles={['admin']}><UserListPage /></PrivateRoute>} />
                                <Route path="/users/add" element={<PrivateRoute allowedRoles={['admin']}><AddUserPage /></PrivateRoute>} />
                                <Route path="/users/edit/:id" element={<PrivateRoute allowedRoles={['admin']}><EditUserPage /></PrivateRoute>} />
                                {/* NEW: Low Stock Report Page Route */}
                                <Route path="/admin/low-stock-report" element={<PrivateRoute allowedRoles={['admin']}><LowStockReportPage /></PrivateRoute>} />

                                {/* Client-specific Routes */}
                                <Route path="/client/dashboard" element={<PrivateRoute allowedRoles={['client', 'admin']}><ClientDashboard /></PrivateRoute>} />
                                <Route path="/client/products" element={<PrivateRoute allowedRoles={['client', 'admin']}><ClientProductsPage /></PrivateRoute>} />
                                <Route path="/my-orders" element={<PrivateRoute allowedRoles={['client', 'admin']}><MyOrdersPage /></PrivateRoute>} />
                                <Route path="/client/categories" element={<PrivateRoute allowedRoles={['client', 'admin']}><ClientCategoryListPage /></PrivateRoute>} /> {/* NEW: Client Categories */}

                                {/* General Routes (accessible by both admin and client) */}
                                <Route path="/orders" element={<PrivateRoute allowedRoles={['admin', 'client']}><OrderListPage /></PrivateRoute>} />
                                <Route path="/orders/add" element={<PrivateRoute allowedRoles={['admin', 'client']}><AddOrderPage /></PrivateRoute>} />
                                <Route path="/orders/edit/:id" element={<PrivateRoute allowedRoles={['admin', 'client']}><EditOrderPage /></PrivateRoute>} />
                                <Route path="/profile" element={<PrivateRoute allowedRoles={['admin', 'client']}><ProfilePage /></PrivateRoute>} />

                                {/* Catch-all route */}
                                <Route path="*" element={<Navigate to={isAuthenticated ? authRedirectPath : '/login'} replace />} />
                            </Routes>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
