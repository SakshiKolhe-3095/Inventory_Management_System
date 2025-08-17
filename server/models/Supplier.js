// server/models/Supplier.js

const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    // Reference to the user (admin) who created this supplier record
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      unique: true, // Supplier names should be unique for a given user
      trim: true,
      maxlength: [100, 'Supplier name must be under 100 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      // Basic email validation regex
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
      default: '', // Optional email
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number must be under 20 characters'],
      default: '', // Optional phone
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address must be under 200 characters'],
      default: '', // Optional address
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Add an index for faster lookups by name and user
supplierSchema.index({ name: 1, user: 1 }, { unique: true }); // Ensure unique name per user

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
