// server/routes/orderRoutes.js

const express = require('express');
const router = express.Router();

const {
    placeOrder,
    getOrders,
    getOrder,
    updateOrder,
    deleteOrder,
    getOrdersTodayCount,
    getRevenueToday,
    getPendingOrdersCount, // Import the new function for dashboard
} = require('../controllers/orderController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// ============================
// 📊 Public/Dashboard Order Routes (No Authentication Required)
// IMPORTANT: Define public routes BEFORE protected ones to ensure they are matched first.
// ============================

// @route   GET /api/orders/today-count
// @desc    Get count of orders placed today
// @access  Public
router.get('/today-count', getOrdersTodayCount);

// @route   GET /api/orders/today-revenue
// @desc    Get total revenue from orders placed today
// @access  Public
router.get('/today-revenue', getRevenueToday);


// ============================
// 🛡️ Protected Routes for Orders (Require Authentication)
// ============================

// IMPORTANT: Define specific static routes BEFORE dynamic :id routes
// @route   GET /api/orders/pending-count
// @desc    Get count of pending orders for dashboard
// @access  Private/Admin
router.get('/pending-count', protect, authorizeRoles('admin'), getPendingOrdersCount);


// @route   POST /api/orders/place
// @desc    Place a new order (for clients)
// @access  Private (Client role, or Admin for manual entry)
router.post('/place', protect, authorizeRoles('client', 'admin'), placeOrder);

// @route   GET /api/orders
// @desc    Get all orders (admin) or orders for current user (client)
// @access  Private
router.get('/', protect, authorizeRoles('admin', 'client'), getOrders);

// @route   GET /api/orders/:id
// @desc    Get a single order by ID
// @access  Private
router.route('/:id')
    .get(protect, authorizeRoles('admin', 'client'), getOrder)
    .put(protect, authorizeRoles('admin', 'client'), updateOrder)
    .delete(protect, authorizeRoles('admin', 'client'), deleteOrder);


module.exports = router;
