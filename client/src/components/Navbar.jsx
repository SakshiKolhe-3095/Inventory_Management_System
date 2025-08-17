// client/src/components/Navbar.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Sun, Moon, Boxes } from 'lucide-react';

function Navbar() {
    const { isAuthenticated, logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    if (!isAuthenticated && !isAuthPage) {
        return null;
    }

    return (
        <header className={`mb-6 p-6 rounded-xl shadow-xl backdrop-blur-md transition-colors duration-300
            ${theme === 'dark' ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-white bg-opacity-80 border-gray-200'}
        `}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h1 className="text-4xl font-bold text-indigo-700 flex items-center dark:text-indigo-300 mb-4 sm:mb-0">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg mr-3">
                        <Boxes className="w-10 h-10 text-white" />
                    </div>
                    Inventory & Stock Management
                </h1>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white shadow-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                    title="Toggle Theme"
                >
                    {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                </button>
            </div>

            {isAuthenticated && !isAuthPage && (
                <>
                    <hr className="border-t border-gray-200 dark:border-gray-600 my-4" />

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-indigo-50 rounded-lg shadow-inner border border-indigo-200 dark:bg-gray-700 dark:border-gray-600">
                        <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-200 mb-2 sm:mb-0">
                            Welcome, {user?.name} (<span className="capitalize">{user?.role}</span>)!
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {user?.role === 'admin' && (
                                <>
                                    <Link
                                        to="/admin/dashboard"
                                        className="text-indigo-600 hover:underline font-medium dark:text-indigo-300"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/products"
                                        className="text-indigo-600 hover:underline font-medium dark:text-indigo-300"
                                    >
                                        Products
                                    </Link>
                                    <Link
                                        to="/categories"
                                        className="text-indigo-600 hover:underline font-medium dark:text-indigo-300"
                                    >
                                        Categories
                                    </Link>
                                    <Link
                                        to="/orders"
                                        className="text-indigo-600 hover:underline font-medium dark:text-indigo-300"
                                    >
                                        Orders
                                    </Link>
                                    <Link
                                        to="/suppliers"
                                        className="text-indigo-600 hover:underline font-medium dark:text-indigo-300"
                                    >
                                        Suppliers
                                    </Link>
                                    <Link
                                        to="/users"
                                        className="text-indigo-600 hover:underline font-medium dark:text-indigo-300"
                                    >
                                        User Management
                                    </Link>
                                </>
                            )}
                            {user?.role === 'client' && (
                                <>
                                    <Link
                                        to="/client/dashboard"
                                        className="text-indigo-600 hover:underline font-medium dark:text-indigo-300"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/client/products"
                                        className="text-indigo-600 hover:underline font-medium dark:text-indigo-300"
                                    >
                                        View Products
                                    </Link>
                                    <Link
                                        to="/client/categories" 
                                        className="text-indigo-600 hover:underline font-medium dark:text-indigo-300"
                                    >
                                        Categories
                                    </Link>
                                    <Link
                                        to="/my-orders"
                                        className="text-indigo-600 hover:underline font-medium dark:text-indigo-300"
                                    >
                                        My Orders
                                    </Link>
                                </>
                            )}
                            {/* Profile Link for all authenticated users */}
                            <Link
                                to="/profile"
                                className="text-indigo-600 hover:underline font-medium dark:text-indigo-300"
                            >
                                My Profile
                            </Link>
                            <button
                                onClick={logout}
                                className="bg-red-500 text-white py-1 px-4 rounded-lg font-bold hover:bg-red-600 transition duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-300"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </>
            )}
        </header>
    );
}

export default Navbar;
