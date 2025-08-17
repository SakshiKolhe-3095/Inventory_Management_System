const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const User = require('../models/User');
const { deductBundleComponentsStock, revertBundleComponentsStock } = require('./productController');

const getTodayDateRange = () => {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    return { startOfToday, endOfToday };
};

const placeOrder = async (req, res) => {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: 'Order must contain at least one product.' });
    }

    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Not authorized: User not authenticated or ID missing.' });
    }

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
        return res.status(404).json({ message: 'Authenticated user not found.' });
    }

    let calculatedTotalPrice = 0;
    const orderedProductsDetails = [];
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        for (const item of products) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                throw new Error('Invalid product item in order: product ID and positive quantity are required.');
            }
            if (!mongoose.Types.ObjectId.isValid(item.productId)) {
                throw new Error(`Invalid product ID: ${item.productId}`);
            }

            const product = await Product.findById(item.productId)
                .populate('category', '_id name')
                .populate('bundleComponents.product', 'name stock sku images')
                .session(session);

            if (!product) {
                throw new Error(`Product not found with ID: ${item.productId}`);
            }

            orderedProductsDetails.push({
                productId: product._id,
                name: product.name,
                category: product.category ? { _id: product.category._id, name: product.category.name } : null,
                quantity: item.quantity,
                price: product.price,
                isBundle: product.isBundle,
            });
            calculatedTotalPrice += item.quantity * product.price;
        }

        const order = await Order.create([{
            user: req.user.id,
            clientName: currentUser.name,
            clientAddress: currentUser.address || 'N/A',
            products: orderedProductsDetails,
            totalPrice: calculatedTotalPrice,
            status: 'Pending',
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(order[0]);

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error placing order:', err.message);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(400).json({ message: err.message || 'Failed to place order.' });
    }
};

const getOrders = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'client') {
            query = { user: req.user.id };
        }
        const orders = await Order.find(query).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) {
        console.error('❌ Get Orders Error:', err);
        res.status(500).json({ message: 'Server error while fetching orders.' });
    }
};

const getOrder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid order ID.' });
    }

    try {
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied to this order.' });
        }

        res.status(200).json(order);
    } catch (err) {
        console.error('❌ Get Order Error:', err);
        res.status(500).json({ message: 'Server error while fetching order.' });
    }
};

const updateOrder = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid order ID.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(id).session(session);
        if (!order) {
            throw new Error('Order not found.');
        }

        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new Error('Access denied to update this order.');
        }

        const oldStatus = order.status;
        const newStatus = updates.status;

        if (newStatus && newStatus !== oldStatus) {
            if (req.user.role !== 'admin') {
                throw new Error('Only administrators can update order status.');
            }

            if ((newStatus === 'Delivered' || newStatus === 'Shipped') &&
                !(oldStatus === 'Delivered' || oldStatus === 'Shipped')) {
                for (const item of order.products) {
                    const product = await Product.findById(item.productId)
                        .populate('bundleComponents.product', 'name stock sku images')
                        .session(session);

                    if (!product) {
                        console.warn(`Product with ID ${item.productId} not found for order ${order._id}. Skipping stock deduction.`);
                        continue;
                    }

                    if (product.isBundle) {
                        await deductBundleComponentsStock(product._id, item.quantity, session);
                    } else {
                        if (product.stock < item.quantity) {
                            throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}. Cannot fulfill order.`);
                        }
                        product.stock -= item.quantity;
                        await product.save({ session });
                    }
                }
            }
            else if (newStatus === 'Cancelled' &&
                     (oldStatus === 'Delivered' || oldStatus === 'Shipped')) {
                for (const item of order.products) {
                    const product = await Product.findById(item.productId)
                        .populate('bundleComponents.product', 'name stock sku images')
                        .session(session);

                    if (!product) {
                        console.warn(`Product with ID ${item.productId} not found for order ${order._id}. Skipping stock reversion.`);
                        continue;
                    }

                    if (product.isBundle) {
                        await revertBundleComponentsStock(product._id, item.quantity, session);
                    } else {
                        product.stock += item.quantity;
                        await product.save({ session });
                    }
                }
            }
            order.status = newStatus;
        }

        if (updates.clientName !== undefined) order.clientName = updates.clientName;
        if (updates.clientAddress !== undefined) order.clientAddress = updates.clientAddress;

        if (updates.products !== undefined && Array.isArray(updates.products)) {
            order.products = updates.products.map(item => ({
                ...item,
                category: item.category && (item.category._id || item.category.name)
                                        ? { _id: item.category._id || new mongoose.Types.ObjectId(), name: item.category.name || 'N/A' }
                                        : null
            }));
        }

        const updatedOrder = await order.save({ session });
        await session.commitTransaction();
        session.endSession();

        res.status(200).json(updatedOrder);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('❌ Update Order Error:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(400).json({ message: err.message || 'Server error while updating order.' });
    }
};

const deleteOrder = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid order ID.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(id).session(session);
        if (!order) {
            throw new Error('Order not found for deletion.');
        }

        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            throw new Error('Access denied to delete this order.');
        }

        if (order.status === 'Delivered' || order.status === 'Shipped') {
            for (const item of order.products) {
                const product = await Product.findById(item.productId)
                    .populate('bundleComponents.product', 'name stock sku images')
                    .session(session);

                if (product) {
                    if (product.isBundle) {
                        await revertBundleComponentsStock(product._id, item.quantity, session);
                    } else {
                        product.stock += item.quantity;
                        await product.save({ session });
                    }
                } else {
                    console.warn(`Product with ID ${item.productId} not found when reverting stock for order ${order._id}. It might have been deleted.`);
                }
            }
        }

        await order.deleteOne({ session });
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Order deleted successfully and product stock reverted (if applicable).' });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('❌ Delete Order Error:', err);
        res.status(400).json({ message: err.message || 'Failed to delete order.' });
    }
};

/**
 * @desc    Get count of orders placed today
 * @route   GET /api/orders/today-count
 * @access  Public
 */
const getOrdersTodayCount = async (req, res) => {
    try {
        console.log('Controller: getOrdersTodayCount - START'); // Debug log
        const { startOfToday, endOfToday } = getTodayDateRange();
        console.log('Controller: getOrdersTodayCount - Date Range:', startOfToday, 'to', endOfToday); // Debug log

        const count = await Order.countDocuments({
            createdAt: {
                $gte: startOfToday,
                $lte: endOfToday,
            },
        });
        console.log('Controller: getOrdersTodayCount - Count:', count); // Debug log
        res.status(200).json({ ordersToday: count });
        console.log('Controller: getOrdersTodayCount - END (Success)'); // Debug log
    } catch (error) {
        console.error('Controller: ❌ Error fetching orders today count:', error); // Debug log
        res.status(500).json({ message: 'Server Error: Could not retrieve orders today count.' });
    }
};

/**
 * @desc    Get total revenue from orders placed today
 * @route   GET /api/orders/today-revenue
 * @access  Public
 */
const getRevenueToday = async (req, res) => {
    try {
        console.log('Controller: getRevenueToday - START'); // Debug log
        const { startOfToday, endOfToday } = getTodayDateRange();
        console.log('Controller: getRevenueToday - Date Range:', startOfToday, 'to', endOfToday); // Debug log

        const result = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startOfToday,
                        $lte: endOfToday,
                    },
                    status: { $in: ['Shipped', 'Delivered'] },
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' },
                },
            },
        ]);

        const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;
        console.log('Controller: getRevenueToday - Total Revenue:', totalRevenue); // Debug log
        res.status(200).json({ revenueToday: totalRevenue });
        console.log('Controller: getRevenueToday - END (Success)'); // Debug log
    } catch (error) {
        console.error('Controller: ❌ Error fetching revenue today:', error); // Debug log
        res.status(500).json({ message: 'Server Error: Could not retrieve revenue today.' });
    }
};

/**
 * @desc    Get count of pending orders
 * @route   GET /api/orders/pending-count
 * @access  Private (Admin only)
 */
const getPendingOrdersCount = async (req, res) => {
    try {
        console.log('Controller: getPendingOrdersCount - START'); // Debug log
        // The protect and authorizeRoles middleware already ensured req.user exists and is 'admin'
        // No need for req.user check here, as it's handled by middleware.
        const count = await Order.countDocuments({ status: 'Pending' });
        console.log('Controller: getPendingOrdersCount - Count:', count); // Debug log
        res.status(200).json({ pendingOrders: count });
        console.log('Controller: getPendingOrdersCount - END (Success)'); // Debug log
    } catch (error) {
        console.error('Controller: ❌ Error fetching pending orders count:', error); // Debug log
        // Ensure a proper status code is sent for internal server errors
        res.status(500).json({ message: 'Server Error: Could not retrieve pending orders count.' });
    }
};


module.exports = {
    placeOrder,
    getOrders,
    getOrder,
    updateOrder,
    deleteOrder,
    getOrdersTodayCount,
    getRevenueToday,
    getPendingOrdersCount,
};
