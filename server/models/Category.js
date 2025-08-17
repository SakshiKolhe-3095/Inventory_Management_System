const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: [true, 'Category name is required'],
            unique: true, // This creates a unique index on 'name'
            trim: true,
            lowercase: true,
            maxlength: [50, 'Category name must be under 50 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, 'Description must be under 200 characters'],
            default: '',
        },
        defaultLowStockThreshold: {
            type: Number,
            min: 0,
            default: 100, // Default threshold for products in this category
        },
    },
    {
        timestamps: true,
    }
);

// Removed the duplicate index definition:
// categorySchema.index({ name: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
