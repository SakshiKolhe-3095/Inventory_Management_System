// server/routes/categoryRoutes.js

const express = require('express');
const router = express.Router();

const {
    createCategory,
    getCategories, // This is the function being updated
    getCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
} = require('../controllers/categoryController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// ============================
// 📊 Public/Dashboard Category Routes (Accessible by Authenticated Admin & Client Roles)
// IMPORTANT: These routes now require authentication and specific roles.
// ============================

// @route   GET /api/categories/all
// @desc    Get all categories (for dashboard lists, etc.)
// @access  Private (Admin, Client)
router.get('/all', protect, authorizeRoles('admin', 'client'), getAllCategories);


// ============================
// 🛡️ Protected Routes for Categories (Require Authentication)
// ============================

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (any logged-in user can create their own categories)
router.post('/', protect, createCategory);

// @route   GET /api/categories
// @desc    Get all categories for the current user (or all if admin)
// @access  Private
router.get('/', protect, getCategories); // <--- This route uses the updated getCategories controller

// @route   GET /api/categories/:id
// @desc    Get a single category by ID
// @access  Private
router.get('/:id', protect, getCategory);

// @route   PUT /api/categories/:id
// @desc    Update a category by ID
// @access  Private (owner only or admin)
router.put('/:id', protect, updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete a category by ID
// @access  Private (owner only or admin)
router.delete('/:id', protect, deleteCategory);

module.exports = router;
