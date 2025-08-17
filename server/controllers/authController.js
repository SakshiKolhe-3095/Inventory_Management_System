// server/controllers/authController.js

const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    // Added 'image' to destructuring
    const { name, email, password, address, role, image } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please enter all required fields: name, email, and password.' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long, contain at least one number, and at least one symbol (!@#$%^&*).'
            });
        }

        let assignedRole = 'client';
        if (role && (role === 'admin' || role === 'client')) {
            assignedRole = role;
        }

        const user = await User.create({
            name,
            email,
            password,
            address: address || '',
            role: assignedRole,
            image: image || undefined, // Pass image, or undefined to use model default
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                address: user.address,
                role: user.role,
                image: user.image, // Include image in response
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data provided.' });
        }
    } catch (error) {
        console.error('❌ Register Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: error.message || 'Server error during registration.' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        if (await user.matchPassword(password)) {
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                address: user.address,
                role: user.role,
                image: user.image, // Include image in response
                token: generateToken(user._id, user.role),
            });
        } else {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: error.message || 'Server error during login.' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no user found in request.' });
    }

    try {
        // ✅ FIX: Explicitly select fields to avoid "exclusion/inclusion" projection error
        // 'password' is excluded by default due to `select: false` in schema
        const user = await User.findById(req.user.id).select('name email address role image createdAt notificationPreferences');
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                address: user.address,
                role: user.role,
                image: user.image, // Include image in response
                createdAt: user.createdAt, // Ensure createdAt is included
                // Ensure notificationPreferences are always returned, with defaults if not set
                notificationPreferences: user.notificationPreferences || { receiveLowStockAlerts: false, lowStockAlertEmail: user.email },
            });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (err) {
        console.error('❌ Error fetching user profile:', err.message);
        res.status(500).json({ message: 'Failed to fetch profile due to a server error.' });
    }
};

// @desc    Update user profile (name, email, address, image, notificationPreferences)
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    // Added 'image' and 'notificationPreferences' to destructuring
    const { name, email, address, image, notificationPreferences } = req.body;

    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no user found in request.' });
    }

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update fields if provided
        if (name !== undefined) user.name = name.trim();
        if (address !== undefined) user.address = address.trim();
        if (image !== undefined) user.image = image.trim(); // NEW: Update image field

        // Handle email update: check for uniqueness if email is changed
        if (email !== undefined && email.trim().toLowerCase() !== user.email.toLowerCase()) {
            const existingUserWithEmail = await User.findOne({ email: email.trim().toLowerCase() });
            if (existingUserWithEmail && existingUserWithEmail._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'This email is already taken by another user.' });
            }
            user.email = email.trim().toLowerCase(); // Save as lowercase
        }

        // --- FIX: Update notification preferences and mark as modified ---
        if (notificationPreferences !== undefined) {
            // Ensure notificationPreferences object exists on user
            if (!user.notificationPreferences) {
                user.notificationPreferences = {};
            }

            // Update individual nested properties
            if (notificationPreferences.receiveLowStockAlerts !== undefined) {
                user.notificationPreferences.receiveLowStockAlerts = notificationPreferences.receiveLowStockAlerts;
            }
            if (notificationPreferences.lowStockAlertEmail !== undefined) {
                user.notificationPreferences.lowStockAlertEmail = notificationPreferences.lowStockAlertEmail.trim().toLowerCase();
            }

            // ✅ IMPORTANT: Tell Mongoose that the nested object has been modified
            user.markModified('notificationPreferences');
        }
        // --- END FIX ---

        const updatedUser = await user.save();

        // Respond with the updated user data, including notificationPreferences
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            address: updatedUser.address,
            role: updatedUser.role,
            image: updatedUser.image, // Include updated image in response
            notificationPreferences: updatedUser.notificationPreferences, // Include updated preferences
            message: 'Profile updated successfully!',
        });
    } catch (err) {
        console.error('❌ Update User Profile Error:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error while updating profile.' });
    }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updateUserPassword = async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no user found in request.' });
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ message: 'Please provide current password, new password, and confirm new password.' });
    }

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: 'New passwords do not match.' });
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            message: 'New password must be at least 8 characters long, contain at least one number, and at least one symbol (!@#$%^&*).'
        });
    }

    try {
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ message: 'Invalid current password.' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully!' });
    } catch (err) {
        console.error('❌ Update User Password Error:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error while updating password.' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
    res.json({ message: 'User logged out successfully (client-side token removal).' });
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    logoutUser,
};
