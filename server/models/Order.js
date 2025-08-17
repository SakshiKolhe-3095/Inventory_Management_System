const mongoose = require('mongoose');

const orderProductSchema = new mongoose.Schema({
  // Store product details at the time of order to prevent data inconsistencies
  // if product details (like name, price) change later.
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // Reference to the Product model, but not strictly required for lookup
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  // --- IMPORTANT CHANGE HERE ---
  // Define category as a nested object to store both _id and name
  category: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // Reference to the Category model
      required: true, // Make sure category ID is stored
    },
    name: {
      type: String,
      required: true, // Make sure category name is stored
    },
  },
  // --- END IMPORTANT CHANGE ---
  quantity: { // Quantity of this specific product in the order
    type: Number,
    required: true,
    min: 1,
  },
  price: { // Price of this specific product at the time of order
    type: Number,
    required: true,
    min: 0,
  },
});

const orderSchema = new mongoose.Schema(
  {
    // Reference to the user (admin or client) who created this order record
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [100, 'Client name must be under 100 characters'],
    },
    clientAddress: {
      type: String,
      required: [true, 'Client address is required'],
      trim: true,
      maxlength: [200, 'Client address must be under 200 characters'],
    },
    // Array of products included in this order
    products: {
      type: [orderProductSchema], // Array of sub-documents using orderProductSchema
      required: [true, 'At least one product is required for an order'],
      validate: {
        validator: function(v) {
          return v && v.length > 0; // Ensure the array is not empty
        },
        message: 'An order must contain at least one product.',
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    // Optional: Order status (e.g., Pending, Completed, Cancelled)
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Pre-save hook to calculate totalPrice before saving the order
orderSchema.pre('save', function(next) {
  this.totalPrice = this.products.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
