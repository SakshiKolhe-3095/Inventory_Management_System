// server/controllers/supplierController.js

const Supplier = require('../models/Supplier');
const mongoose = require('mongoose');

// @desc    Create a new supplier
// @route   POST /api/suppliers
// @access  Private (Admin only, or any user if you want them to manage their own suppliers)
const createSupplier = async (req, res) => {
    const { name, email, phone, address } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Supplier name is required.' });
    }

    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Not authorized to create supplier: User not authenticated or ID missing.' });
    }

    try {
        // Check if supplier with the same name already exists for this user
        const existingSupplier = await Supplier.findOne({ name, user: req.user.id });
        if (existingSupplier) {
            return res.status(400).json({ message: 'Supplier with this name already exists.' });
        }

        const supplier = await Supplier.create({
            user: req.user.id,
            name,
            email,
            phone,
            address,
        });

        res.status(201).json(supplier);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        // Handle duplicate key error specifically for 'name' if it's a global unique index (from your schema)
        if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
            return res.status(400).json({ message: `Supplier name "${err.keyValue.name}" already exists.` });
        }
        res.status(500).json({ message: 'Server error while creating supplier: ' + err.message });
    }
};

// @desc    Get all suppliers (admin) or user-specific suppliers (client)
// @route   GET /api/suppliers
// @access  Private (requires authentication)
const getSuppliers = async (req, res) => {
    try {
        let query = {};
        // Check if the authenticated user has the 'admin' role
        if (req.user && req.user.role === 'admin') {
            // If admin, fetch all suppliers
            query = {};
        } else if (req.user && req.user.id) {
            // If not admin, fetch suppliers specific to the logged-in user
            query = { user: req.user.id };
        } else {
            return res.status(401).json({ message: 'Not authorized, user information missing.' });
        }

        const suppliers = await Supplier.find(query).sort({ name: 1 });
        res.status(200).json(suppliers);
    } catch (err) {
        res.status(500).json({ message: 'Server error while fetching suppliers.' });
    }
};

// @desc    Get a single supplier by ID
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplier = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid supplier ID.' });
    }
    try {
        const supplier = await Supplier.findById(id);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found.' });
        }
        // Allow admin to view any supplier, otherwise restrict to owner
        if (req.user.role !== 'admin' && supplier.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied to this supplier.' });
        }
        res.status(200).json(supplier);
    } catch (err) {
        res.status(500).json({ message: 'Server error while fetching supplier.' });
    }
};

// @desc    Update a supplier by ID
// @route   PUT /api/suppliers/:id
// @access  Private
const updateSupplier = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid supplier ID.' });
    }
    try {
        const supplier = await Supplier.findById(id);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found.' });
        }
        // Allow admin to update any supplier, otherwise restrict to owner
        if (req.user.role !== 'admin' && supplier.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied to update this supplier.' });
        }
        // Check if new name conflicts with existing suppliers (excluding self)
        if (name && name !== supplier.name) {
            // If admin, check for global uniqueness. If non-admin, check for user-specific uniqueness.
            const existingSupplierWithName = req.user.role === 'admin'
                ? await Supplier.findOne({ name })
                : await Supplier.findOne({ name, user: req.user.id });

            if (existingSupplierWithName && existingSupplierWithName._id.toString() !== id) {
                return res.status(400).json({ message: 'Supplier with this name already exists.' });
            }
        }
        // Update fields if provided
        if (name !== undefined) supplier.name = name.trim();
        if (email !== undefined) supplier.email = email.trim();
        if (phone !== undefined) supplier.phone = phone.trim();
        if (address !== undefined) supplier.address = address.trim();

        const updatedSupplier = await supplier.save();
        res.status(200).json(updatedSupplier);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        // Handle duplicate key error specifically for 'name' if it's a global unique index
        if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
            return res.status(400).json({ message: `Supplier name "${err.keyValue.name}" already exists.` });
        }
        res.status(500).json({ message: 'Server error while updating supplier: ' + err.message });
    }
};

// @desc    Delete a supplier by ID
// @route   DELETE /api/suppliers/:id
// @access  Private
const deleteSupplier = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid supplier ID.' });
    }
    try {
        const supplier = await Supplier.findById(id);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found.' });
        }
        // Allow admin to delete any supplier, otherwise restrict to owner
        if (req.user.role !== 'admin' && supplier.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied to delete this supplier.' });
        }
        await supplier.deleteOne();
        res.status(200).json({ message: 'Supplier deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error while deleting supplier.' });
    }
};

// @desc    Get all suppliers (for dashboard display, not user-specific)
// @route   GET /api/suppliers/all
// @access  Public
const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({}).sort({ name: 1 });
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not retrieve all suppliers.' });
    }
};


module.exports = {
    createSupplier,
    getSuppliers,
    getSupplier,
    updateSupplier,
    deleteSupplier,
    getAllSuppliers,
};
