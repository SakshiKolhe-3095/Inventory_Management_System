// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
    getLowStockProducts,
    getLowStockCount,
    sendAllLowStockAlerts,
    sendSingleLowStockAlert
} = require('../controllers/reportController');

// Import the new activity controller
const { getRecentActivities } = require('../controllers/activityController'); // <-- NEW IMPORT

// @route   GET /api/reports/low-stock
// @desc    Get all products that are below their low stock threshold
// @access  Private (Admin only)
router.get('/low-stock', protect, authorizeRoles('admin'), getLowStockProducts);

// @route   GET /api/reports/low-stock-count
// @desc    Get count of low stock products for dashboard display
// @access  Private (Admin only)
router.get('/low-stock-count', protect, authorizeRoles('admin'), getLowStockCount);

// @route   POST /api/reports/send-all-low-stock-alerts
// @desc    Trigger all low stock alerts (for cron or mass manual trigger)
// @access  Private (Admin only)
router.post('/send-all-low-stock-alerts', protect, authorizeRoles('admin'), sendAllLowStockAlerts);

// @route   POST /api/reports/low-stock/alert/:productId
// @desc    Manually send a low stock alert for a specific product
// @access  Private (Admin only)
router.post('/low-stock/alert/:productId', protect, authorizeRoles('admin'), sendSingleLowStockAlert);

// @route   GET /api/reports/recent-activities
// @desc    Get recent activities for the dashboard
// @access  Private (Admin only)
router.get('/recent-activities', protect, authorizeRoles('admin'), getRecentActivities); // <-- NEW ROUTE ADDED

module.exports = router;
