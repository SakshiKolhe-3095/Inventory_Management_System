// server/routes/userManagementRoutes.js

const express = require('express');
const router = express.Router();

const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserCount, // Import the new function for dashboard
} = require('../controllers/userManagementController'); // Assuming getUserCount is here

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// ============================
// 🛡️ Protected Routes for User Management (Admin Only)
// ============================

// IMPORTANT: Define specific static routes BEFORE dynamic :id routes
// @route   GET /api/users/count
// @desc    Get total user count for dashboard
// @access  Private/Admin
router.get('/count', protect, authorizeRoles('admin'), getUserCount);


// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', protect, authorizeRoles('admin'), getAllUsers);

// @route   POST /api/users
// @desc    Create a new user (by admin)
// @access  Private/Admin
router.post('/', protect, authorizeRoles('admin'), createUser);

// @route   GET /api/users/:id
// @desc    Get a single user by ID
// @access  Private/Admin
router.route('/:id')
    .get(protect, authorizeRoles('admin'), getUserById)
    .put(protect, authorizeRoles('admin'), updateUser)
    .delete(protect, authorizeRoles('admin'), deleteUser);


module.exports = router;
