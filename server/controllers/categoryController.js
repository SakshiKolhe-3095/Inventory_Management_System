const Category = require('../models/Category');
const mongoose = require('mongoose');

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Admin only)
const createCategory = async (req, res) => {
    // Destructure new field: defaultLowStockThreshold
    const { name, description, defaultLowStockThreshold } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required.' });
    }

    if (!req.user || req.user.role !== 'admin') { // Assuming only admin can create categories
        return res.status(403).json({ message: 'Not authorized to create category: Only administrators can perform this action.' });
    }

    try {
        // Convert name to lowercase for consistent storage and comparison
        const lowerCaseName = name.trim().toLowerCase();

        // Check if category with the same name already exists (globally unique index)
        const existingCategory = await Category.findOne({ name: lowerCaseName });
        if (existingCategory) {
            return res.status(400).json({ message: `Category with name "${name}" already exists.` });
        }

        const category = await Category.create({
            user: req.user.id, // User who created it
            name: lowerCaseName, // Save as lowercase
            description: description ? description.trim() : '',
            defaultLowStockThreshold: defaultLowStockThreshold !== undefined ? defaultLowStockThreshold : 100, // Set default
        });

        res.status(201).json(category);
    } catch (err) {
        console.error('❌ Create Category Error:', err); // Added error logging
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
            return res.status(400).json({ message: `Category name "${err.keyValue.name}" already exists.` });
        }
        res.status(500).json({ message: 'Server error while creating category: ' + err.message });
    }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private (requires authentication)
const getCategories = async (req, res) => {
    try {
        let query = {};
        // Assuming all authenticated users can see all categories for product viewing
        const categories = await Category.find(query).sort({ name: 1 });
        res.status(200).json(categories);
    } catch (err) {
        console.error('❌ Get Categories Error:', err);
        res.status(500).json({ message: 'Server error while fetching categories.' });
    }
};

// @desc    Get a single category by ID
// @route   GET /api/categories/:id
// @access  Private
const getCategory = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid category ID.' });
    }
    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.status(200).json(category);
    } catch (err) {
        console.error('❌ Get Category Error:', err);
        res.status(500).json({ message: 'Server error while fetching category.' });
    }
};

// @desc    Update a category by ID
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
const updateCategory = async (req, res) => {
    const { id } = req.params;
    // Destructure new field: defaultLowStockThreshold
    const { name, description, defaultLowStockThreshold } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid category ID.' });
    }

    if (!req.user || req.user.role !== 'admin') { // Assuming only admin can update categories
        return res.status(403).json({ message: 'Access denied to update this category.' });
    }

    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        // Check if new name conflicts with existing categories (excluding self)
        if (name && name.trim().toLowerCase() !== category.name) {
            const lowerCaseNewName = name.trim().toLowerCase();
            const existingCategoryWithName = await Category.findOne({ name: lowerCaseNewName });
            if (existingCategoryWithName && existingCategoryWithName._id.toString() !== id) {
                return res.status(400).json({ message: `Category name "${name}" already exists.` });
            }
        }
        // Update fields
        if (name !== undefined) category.name = name.trim().toLowerCase();
        if (description !== undefined) category.description = description.trim();
        if (defaultLowStockThreshold !== undefined) category.defaultLowStockThreshold = defaultLowStockThreshold; // Update default threshold
        const updatedCategory = await category.save();
        res.status(200).json(updatedCategory);
    } catch (err) {
        console.error('❌ Update Category Error:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
            return res.status(400).json({ message: `Category name "${err.keyValue.name}" already exists.` });
        }
        res.status(500).json({ message: 'Server error while updating category: ' + err.message });
    }
};

// @desc    Delete a category by ID
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
const deleteCategory = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid category ID.' });
    }

    if (!req.user || req.user.role !== 'admin') { // Assuming only admin can delete categories
        return res.status(403).json({ message: 'Access denied to delete this category.' });
    }

    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        await category.deleteOne();
        res.status(200).json({ message: 'Category deleted successfully.' });
    } catch (err) {
        console.error('❌ Delete Category Error:', err);
        res.status(500).json({ message: 'Server error while deleting category.' });
    }
};

// @desc    Get all categories (for dashboard display, not user-specific)
// @route   GET /api/categories/all
// @access  Public
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching all categories:', error);
        res.status(500).json({ message: 'Server Error: Could not retrieve all categories.' });
    }
};


module.exports = {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
};
