// client/src/components/LowStockProductsListCard.jsx
import React from 'react';
import { AlertTriangle, MinusCircle } from 'lucide-react'; // Ensure these icons are imported

/**
 * Reusable component to display a list of low stock or out of stock products.
 *
 * @param {Object} props - Component props.
 * @param {Array<Object>} props.products - An array of product objects to display.
 * @param {'low' | 'out'} props.type - The type of stock alert ('low' or 'out').
 * @param {string} props.title - The title for the card (e.g., "Low Stock Products").
 * @param {Object} props.icon - Lucide React icon component (e.g., AlertTriangle, MinusCircle).
 * @param {string} props.iconColor - Tailwind CSS class for icon color (e.g., 'text-yellow-500').
 * @param {string} props.emptyMessage - Message to display when there are no products.
 */
const LowStockProductsListCard = ({ products, type, title, icon: Icon, iconColor, emptyMessage }) => {
    // Determine the styling based on the type (low or out)
    const textColor = type === 'low' ? 'text-yellow-500' : 'text-red-500';
    const bgColor = type === 'low' ? 'bg-yellow-50' : 'bg-red-50';
    const darkBgColor = type === 'low' ? 'dark:bg-yellow-900/20' : 'dark:bg-red-900/20';

    return (
        <div className={`p-4 rounded-lg shadow-sm border ${bgColor} ${darkBgColor} dark:border-gray-600`}>
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-800 dark:text-white flex items-center">
                    {Icon && <Icon className={`w-5 h-5 mr-2 ${iconColor}`} />}
                    {title}
                </h4>
                {/* Display count next to the title */}
                <span className={`text-lg font-bold ${textColor}`}>
                    {products.length}
                </span>
            </div>

            {products.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 text-sm py-2">{emptyMessage}</p>
            ) : (
                <ul className="space-y-3">
                    {products.map((product) => (
                        <li key={product.id} className="flex items-center justify-between p-3 rounded-md bg-white dark:bg-gray-800 shadow-xs border border-gray-200 dark:border-gray-700">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">SKU: {product.sku}</p>
                            </div>
                            {type === 'low' && (
                                <span className={`text-sm font-semibold ${textColor}`}>Stock: {product.stock}</span>
                            )}
                            {type === 'out' && (
                                <span className={`text-sm font-semibold ${textColor}`}>OUT</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LowStockProductsListCard;
