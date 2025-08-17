// server/routes/productRoutes.js

const express = require('express');
const router = express.Router();

const {
    createProduct,
    getProducts, // This is the function being updated
    getProduct,
    updateProduct,
    deleteProduct,
    getProductCount,
    getTotalStock,
    getAllProductsList,
} = require('../controllers/productController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// ============================
// 📊 Public/Dashboard Routes (Accessible by Authenticated Admin & Client Roles)
// IMPORTANT: These routes now require authentication and specific roles.
// ============================

// @route   GET /api/products/count
// @desc    Get total product count (all products in the database)
// @access  Private (Admin, Client)
router.get('/count', protect, authorizeRoles('admin', 'client'), getProductCount);

// @route   GET /api/products/total-stock
// @desc    Get total stock quantity across all products
// @access  Private (Admin, Client)
router.get('/total-stock', protect, authorizeRoles('admin', 'client'), getTotalStock);

// @route   GET /api/products/all
// @desc    Get all products (for dashboard lists, etc.)
// @access  Private (Admin, Client)
router.get('/all', protect, authorizeRoles('admin', 'client'), getAllProductsList);


// ============================
// 🛡️ Protected Routes (Require Authentication)
// These routes will still require a valid JWT token
// ============================

// @route   POST /api/products
// @desc    Create a new product
// @access  Private (any logged-in user)
router.post('/', protect, createProduct);

// @route   GET /api/products
// @desc    Get all products of current user (or all if admin)
// @access  Private
router.get('/', protect, getProducts); // <--- This route uses the updated getProducts controller

// @route   GET /api/products/:id
// @desc    Get a single product by ID
// @access  Private
router.get('/:id', protect, getProduct);

// @route   PUT /api/products/:id
// @desc    Update a product by ID
// @access  Private (owner only or admin)
router.put('/:id', protect, updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete a product by ID
// @access  Private (owner only or admin)
router.delete('/:id', protect, deleteProduct);


module.exports = router;
