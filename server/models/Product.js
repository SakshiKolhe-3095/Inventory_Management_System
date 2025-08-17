const mongoose = require('mongoose');

// Define the Product Schema
const productSchema = new mongoose.Schema(
    {
        // Reference to User who created the product
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        // Product Name
        name: {
            type: String,
            required: [true, 'Product name is required'],
            unique: true, // This creates a unique index on 'name'
            trim: true,
            maxlength: [100, 'Product name must be under 100 characters'],
        },

        // SKU: Stock Keeping Unit
        sku: {
            type: String,
            default: 'N/A',
            trim: true,
            uppercase: true,
        },

        // Category: Now references the Category model by its ObjectId
        category: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Category is required'],
            ref: 'Category', // REFERENCES THE 'Category' MODEL
        },

        // Stock
        stock: {
            type: Number,
            required: [true, 'Stock quantity is required'],
            min: [0, 'Stock cannot be negative'],
            default: 0,
        },

        // Price
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
            default: 0,
        },

        // Description
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [1000, 'Description must be under 1000 characters'],
        },

        // Image URL
        image: {
            type: String, // Will be updated to an array of strings later for multiple images
            default: 'https://placehold.co/600x400/cccccc/ffffff?text=No+Image',
            validate: {
                validator: function (url) {
                    return /^https?:\/\/.+/.test(url);
                },
                message: 'Please provide a valid image URL',
            },
        },

        // Supplier
        supplier: {
            type: String,
            required: [true, 'Supplier is required'],
            trim: true,
            maxlength: [100, 'Supplier name must be under 100 characters'],
        },

        // Custom Fields for Products
        customFields: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        // Bin Location Tracking
        binLocation: {
            type: String,
            trim: true,
            maxlength: [50, 'Bin location must be under 50 characters'],
            default: 'Main',
        },

        // Low Stock Threshold
        lowStockThreshold: {
            type: Number,
            min: 0,
            default: 50, // Default product-specific threshold
        },

        // --- NEW FIELDS FOR PRODUCT BUNDLING/KITS ---
        isBundle: {
            type: Boolean,
            default: false, // False by default, indicates a regular product
        },
        bundleComponents: [ // Array of objects defining what's in the bundle
            {
                product: { // Reference to another product (the component)
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                quantity: { // Quantity of this component in the bundle
                    type: Number,
                    required: true,
                    min: 1,
                },
            },
        ],
        // --- END NEW FIELDS ---
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Optional: Add an index on category for better query performance
productSchema.index({ category: 1 });

// Export the Product model
const Product = mongoose.model('Product', productSchema);
module.exports = Product;
