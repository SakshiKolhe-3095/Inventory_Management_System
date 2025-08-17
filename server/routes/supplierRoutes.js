// server/routes/supplierRoutes.js

const express = require('express');
const router = express.Router();

const {
    createSupplier,
    getSuppliers,
    getSupplier,
    updateSupplier,
    deleteSupplier,
    getAllSuppliers,
} = require('../controllers/supplierController');

const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// ============================
// 📊 Public/Dashboard Supplier Routes (No Authentication Required)
// IMPORTANT: Define public routes BEFORE protected ones.
// ============================

// @route   GET /api/suppliers/all
// @desc    Get all suppliers (for dashboard lists, etc.)
// @access  Public
router.get('/all', getAllSuppliers);


// ============================
// 🛡️ Protected Routes for Suppliers (Require Authentication)
// ============================

// @route   POST /api/suppliers
// @desc    Create a new supplier
// @access  Private (Admin only, or any user if you want them to manage their own suppliers)
router.post('/', protect, createSupplier);

// @route   GET /api/suppliers
// @desc    Get all suppliers for the current user (or all if admin)
// @access  Private
router.get('/', protect, getSuppliers);

// @route   GET /api/suppliers/:id
// @desc    Get a single supplier by ID
// @access  Private
router.get('/:id', protect, getSupplier);

// @route   PUT /api/suppliers/:id
// @desc    Update a supplier by ID
// @access  Private (owner only or admin)
router.put('/:id', protect, updateSupplier);

// @route   DELETE /api/suppliers/:id
// @desc    Delete a supplier by ID
// @access  Private (owner only or admin)
router.delete('/:id', protect, deleteSupplier);

module.exports = router;
