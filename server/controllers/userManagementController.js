const User = require('../models/User');
const mongoose = require('mongoose');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        console.error('❌ Get All Users Error:', err);
        res.status(500).json({ message: 'Server error while fetching users.' });
    }
};

const getUserById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user ID.' });
    }

    try {
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error('❌ Get User By ID Error:', err);
        res.status(500).json({ message: 'Server error while fetching user.' });
    }
};

const createUser = async (req, res) => {
    const { name, email, password, address, role, notificationPreferences } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please enter all required fields: name, email, password, role.' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with that email already exists.' });
        }

        const newUser = await User.create({
            name,
            email,
            password,
            address: address || '',
            role,
            notificationPreferences: notificationPreferences || {
                receiveLowStockAlerts: false,
                lowStockAlertEmail: email,
            }
        });

        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({ message: 'User created successfully.', user: userResponse });
    } catch (err) {
        console.error('❌ Create User Error:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error while creating user.' });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, address, role, notificationPreferences, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user ID.' });
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (req.user.id === id && role && role !== user.role) {
            return res.status(403).json({ message: 'You cannot change your own role.' });
        }

        if (name !== undefined) user.name = name.trim();
        if (email !== undefined) {
            if (email.trim().toLowerCase() !== user.email) {
                const existingUserWithEmail = await User.findOne({ email: email.trim().toLowerCase() });
                if (existingUserWithEmail && existingUserWithEmail._id.toString() !== id) {
                    return res.status(400).json({ message: 'User with this email already exists.' });
                }
            }
            user.email = email.trim().toLowerCase();
        }
        if (address !== undefined) user.address = address.trim();
        if (role !== undefined) user.role = role.trim();
        if (image !== undefined) user.image = image.trim();

        if (notificationPreferences !== undefined) {
            if (!user.notificationPreferences) {
                user.notificationPreferences = {};
            }
            if (notificationPreferences.receiveLowStockAlerts !== undefined) {
                user.notificationPreferences.receiveLowStockAlerts = notificationPreferences.receiveLowStockAlerts;
            }
            if (notificationPreferences.lowStockAlertEmail !== undefined) {
                user.notificationPreferences.lowStockAlertEmail = notificationPreferences.lowStockAlertEmail.trim().toLowerCase();
            }
            user.markModified('notificationPreferences');
        }

        if (password) {
            user.password = password;
        }

        const updatedUser = await user.save();

        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        res.status(200).json({ message: 'User updated successfully.', user: userResponse });
    } catch (err) {
        console.error('❌ Update User Error:', err);
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((val) => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error while updating user.' });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user ID.' });
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (req.user.id === id) {
            return res.status(403).json({ message: 'You cannot delete your own account through this interface.' });
        }

        await user.deleteOne();
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (err) {
        console.error('❌ Delete User Error:', err);
        res.status(500).json({ message: 'Server error while deleting user.' });
    }
};

/**
 * @desc    Get total user count
 * @route   GET /api/users/count
 * @access  Private (Admin only)
 */
const getUserCount = async (req, res) => {
    try {
        console.log('Controller: getUserCount - START'); // Debug log
        // The protect and authorizeRoles middleware already ensured req.user exists and is 'admin'
        // No need for req.user check here, as it's handled by middleware.
        const count = await User.countDocuments({});
        console.log('Controller: getUserCount - Count:', count); // Debug log
        res.status(200).json({ count: count });
        console.log('Controller: getUserCount - END (Success)'); // Debug log
    } catch (error) {
        console.error('Controller: ❌ Error fetching user count:', error); // Debug log
        // Ensure a proper status code is sent for internal server errors
        res.status(500).json({ message: 'Server Error: Could not retrieve user count.' });
    }
};


module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserCount,
};
