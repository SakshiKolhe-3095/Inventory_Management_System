const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                'Please enter a valid email',
            ],
        },
        address: {
            type: String,
            required: false, // Address is optional for initial registration
            trim: true,
            maxlength: [200, 'Address must be under 200 characters'],
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false,
        },
        role: {
            type: String,
            enum: ['admin', 'client'],
            default: 'client',
            required: true,
        },
        image: { // Profile image URL field
            type: String,
            default: 'https://placehold.co/100x100/cccccc/ffffff?text=User', // Default placeholder image
            validate: {
                validator: function (url) {
                    // Basic URL validation: must start with http(s):// and have at least one character after //
                    return url ? /^https?:\/\/.+/.test(url) : true; // Allow empty string or valid URL
                },
                message: 'Please provide a valid image URL',
            },
        },
        // --- NEW FIELDS FOR LOW STOCK ALERTS ---
        notificationPreferences: {
            receiveLowStockAlerts: {
                type: Boolean,
                default: false,
            },
            lowStockAlertEmail: {
                type: String,
                trim: true,
                lowercase: true,
                // Only required if receiveLowStockAlerts is true
                validate: {
                    validator: function(v) {
                        return this.notificationPreferences.receiveLowStockAlerts ? (v && /.+@.+\..+/.test(v)) : true;
                    },
                    message: 'Please provide a valid email for low stock alerts if enabled.',
                },
            },
        },
        // --- END NEW FIELDS ---
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) {
        console.error("Attempted to match password but 'this.password' is undefined. Ensure .select('+password') is used in query.");
        return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
