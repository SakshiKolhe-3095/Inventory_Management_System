import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useNotification } from '../components/Notification.jsx'; // Import the useNotification hook
import { Mail, Lock, Eye, EyeOff, Package, Cog, BarChart3, Shield } from 'lucide-react';

// Removed showTimedMessage from props, it will be accessed via hook
function LoginPage() {
    const { login, authActionInProgress, isAuthenticated, user } = useAuth();
    const { showTimedMessage } = useNotification(); // Use the custom hook to get showTimedMessage

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            // Option 1: Navigate to the root, let App.js handle role-based redirect
            navigate('/');

            // Option 2 (More specific, if you prefer explicit control here, keep consistent with Register.jsx):
            // if (user?.role === 'admin') {
            //     navigate('/admin/dashboard');
            // } else if (user?.role === 'client') {
            //     navigate('/client/dashboard');
            // } else {
            //     navigate('/'); // Fallback
            // }
        }
    }, [isAuthenticated, navigate, user]); // Added 'user' to dependency array for Option 2

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            showTimedMessage('Please enter both email and password.', 3000);
            return;
        }

        const result = await login(email, password);

        if (result.success) {
            showTimedMessage('Login successful! Welcome.', 3000);
            // Redirection is handled by the useEffect hook above or App.js
        } else {
            // This message is intentionally generic for security reasons
            showTimedMessage(result.message || 'Invalid email or password. Please try again.', 5000);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            <div className="relative w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
                {/* Left Side - Branding */}
                <div className="hidden lg:block text-white space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl">
                                <Package className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Mechtronix Industries</h1>
                                <p className="text-blue-200">Inventory Management System</p>
                            </div>
                        </div>

                        <div className="mt-8 space-y-6">
                            <h2 className="text-2xl font-semibold text-white">
                                Unlock Your Inventory's Potential
                            </h2>
                            <p className="text-lg text-blue-100 leading-relaxed">
                                Seamlessly manage your stock, track movements, and gain insights with Mechtronix Industries' intuitive platform. Log in to transform your operations.
                            </p>
                        </div>
                    </div>
                    {/* Features */}
                    <div className="grid grid-cols-1 gap-4 mt-12">
                        <div className="flex items-center space-x-3 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                            <BarChart3 className="w-6 h-6 text-blue-300" />
                            <div>
                                <h3 className="font-semibold text-white">Real-time Analytics</h3>
                                <p className="text-sm text-blue-200">Monitor inventory levels and trends</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                            <Cog className="w-6 h-6 text-blue-300" />
                            <div>
                                <h3 className="font-semibold text-white">Automated Workflows</h3>
                                <p className="text-sm text-blue-200">Streamline your processes</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                            <Shield className="w-6 h-6 text-blue-300" />
                            <div>
                                <h3 className="font-semibold text-white">Secure & Reliable</h3>
                                <p className="text-sm text-blue-200">Enterprise-grade security</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full max-w-md mx-auto lg:mx-0">
                    {/* Mobile Header */}
                    <div className="lg:hidden mb-8 text-center">
                        <div className="flex items-center justify-center space-x-3 mb-4">
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">Mechtronix Industries</h1>
                        </div>
                        <p className="text-blue-200">Inventory Management System</p>
                    </div>

                    <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
                        <div className="text-center mb-8">
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
                            <p className="text-gray-600">Sign in to your account</p>
                        </div>
                        <div className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="your@mechtronix.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 bg-white"
                                        required
                                    />
                                </div>
                            </div>
                            {/* Password Field */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 bg-white"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={authActionInProgress}
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {authActionInProgress ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Logging in...</span>
                                    </div>
                                ) : (
                                    'Log In'
                                )}
                            </button>
                        </div>
                        <div className="mt-8 text-center">
                            <p className="text-gray-600">
                                Don't have an account?{' '}
                                <Link
                                    to="/register"
                                    className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                                >
                                    Register here
                                </Link>
                            </p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-xs text-gray-500 text-center">
                                © 2025 Mechtronix Industries. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;