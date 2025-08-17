// client/src/components/OrderQuantityModal.jsx

import React, { useState, useEffect } from 'react';
import { XCircle, ShoppingCart } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useNotification } from './Notification.jsx'; // Correct path (same folder)

function OrderQuantityModal({ isOpen, onClose, product, onConfirmOrder }) {
    const [quantity, setQuantity] = useState(1);
    const { theme } = useTheme();
    const { showTimedMessage } = useNotification();

    // Reset quantity when modal opens for a new product
    useEffect(() => {
        if (isOpen && product) {
            setQuantity(1); // Default to 1
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 1) {
            setQuantity(value);
        } else if (e.target.value === '') {
            setQuantity(''); // Allow clearing the input temporarily
        }
    };

    const handleConfirm = () => {
        const finalQuantity = parseInt(quantity, 10);
        if (isNaN(finalQuantity) || finalQuantity <= 0) {
            showTimedMessage('Please enter a valid quantity greater than zero.', 3000, 'error');
            return;
        }
        if (finalQuantity > product.stock) {
            showTimedMessage(`Cannot order ${finalQuantity}. Only ${product.stock} in stock.`, 5000, 'error');
            return;
        }
        onConfirmOrder(product._id, finalQuantity);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`p-8 rounded-xl shadow-2xl w-full max-w-md text-center transform transition-all duration-300 scale-100 opacity-100
                ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
            `}>
                <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <ShoppingCart className="w-7 h-7 text-blue-500 mr-2" />
                        Order Quantity
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        title="Close"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="text-left mb-6 space-y-3">
                    <p className="text-lg font-semibold">Product: <span className="font-normal">{product.name}</span></p>
                    <p className="text-lg font-semibold">Available Stock: <span className="font-normal">{product.stock}</span></p>
                    <p className="text-lg font-semibold">Price per unit: <span className="font-normal">${product.price.toFixed(2)}</span></p>
                    <div className="mt-4">
                        <label htmlFor="orderQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            Quantity to Order:
                        </label>
                        <input
                            type="number"
                            id="orderQuantity"
                            value={quantity}
                            onChange={handleQuantityChange}
                            min="1"
                            max={product.stock} // Max quantity is available stock
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        {quantity > product.stock && (
                            <p className="text-red-500 text-sm mt-1">Quantity exceeds available stock!</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onClose}
                        className={`px-6 py-2 rounded-lg font-semibold border
                            ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
                            transition-colors
                        `}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!quantity || quantity <= 0 || quantity > product.stock}
                        className="px-6 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm Order
                    </button>
                </div>
            </div>
        </div>
    );
}

export default OrderQuantityModal;
