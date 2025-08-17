// backend/controllers/activityController.js
const Product = require('../models/Product'); // Adjust path as per your project structure
const Order = require('../models/Order');     // Adjust path
const User = require('../models/User');       // Adjust path

// Helper function to calculate relative time (e.g., "5 minutes ago")
const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " year" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " month" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " day" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hour" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minute" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
    return Math.floor(seconds) + " second" + (Math.floor(seconds) === 1 ? "" : "s") + " ago";
};

/**
 * @desc Get recent activities for the dashboard
 * @route GET /api/reports/recent-activities  <-- Updated JSDoc comment for clarity
 * @access Private/Admin
 */
exports.getRecentActivities = async (req, res) => {
    try {
        // Ensure only admins can access this route
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days for some activities

        let activities = [];

        // 1. Fetch recent orders (e.g., created in the last 24 hours)
        const recentOrders = await Order.find({ createdAt: { $gte: twentyFourHoursAgo } })
                                        .populate('user', 'name') // Populate user name for message
                                        .sort({ createdAt: -1 })
                                        .limit(10); // Limit to a reasonable number

        recentOrders.forEach(order => {
            activities.push({
                id: order._id.toString(),
                type: 'new_order',
                message: `New order #${order.orderNumber} placed by ${order.user ? order.user.name : 'Guest'}`,
                time: timeAgo(order.createdAt),
                timestamp: order.createdAt, // Keep original timestamp for sorting
                icon: 'ShoppingCart', // Lucide React icon name
                color: 'text-green-500'
            });
        });

        // 2. Fetch recent product updates (new products or stock changes in last 7 days)
        const recentProducts = await Product.find({ updatedAt: { $gte: sevenDaysAgo } })
                                            .sort({ updatedAt: -1 })
                                            .limit(10);

        recentProducts.forEach(product => {
            const isNewProduct = (new Date(product.updatedAt) - new Date(product.createdAt)) < 5000; // Within 5 seconds
            const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 10);
            const isOutOfStock = product.stock === 0;

            if (isNewProduct) {
                activities.push({
                    id: product._id.toString(),
                    type: 'new_product',
                    message: `New product added: "${product.name}"`,
                    time: timeAgo(product.createdAt),
                    timestamp: product.createdAt,
                    icon: 'PlusCircle',
                    color: 'text-blue-500'
                });
            } else if (isOutOfStock) {
                activities.push({
                    id: product._id.toString(),
                    type: 'stock_out',
                    message: `"${product.name}" is out of stock!`,
                    time: timeAgo(product.updatedAt),
                    timestamp: product.updatedAt,
                    icon: 'Layers', // Or MinusCircle
                    color: 'text-red-500'
                });
            } else if (isLowStock) {
                activities.push({
                    id: product._id.toString(),
                    type: 'stock_low',
                    message: `"${product.name}" stock is low (${product.stock} left)`,
                    time: timeAgo(product.updatedAt),
                    timestamp: product.updatedAt,
                    icon: 'AlertTriangle',
                    color: 'text-yellow-500'
                });
            } else {
                activities.push({
                    id: product._id.toString(),
                    type: 'product_update',
                    message: `Stock updated for "${product.name}" to ${product.stock}`,
                    time: timeAgo(product.updatedAt),
                    timestamp: product.updatedAt,
                    icon: 'Package',
                    color: 'text-gray-500'
                });
            }
        });

        // 3. Fetch recent user registrations (last 7 days)
        const recentUsers = await User.find({ createdAt: { $gte: sevenDaysAgo } })
                                      .sort({ createdAt: -1 })
                                      .limit(5);

        recentUsers.forEach(user => {
            activities.push({
                id: user._id.toString(),
                type: 'new_user',
                message: `New user registered: ${user.name || user.email}`,
                time: timeAgo(user.createdAt),
                timestamp: user.createdAt,
                icon: 'Users',
                color: 'text-purple-500'
            });
        });

        // Sort all activities by timestamp in descending order and limit the total number
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const finalActivities = activities.slice(0, 15); // Show top 15 most recent activities

        // Remove the temporary timestamp field before sending to frontend
        const cleanedActivities = finalActivities.map(({ timestamp, ...rest }) => rest);

        res.status(200).json(cleanedActivities);

    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({ message: 'Server Error: Could not fetch recent activities.' });
    }
};
