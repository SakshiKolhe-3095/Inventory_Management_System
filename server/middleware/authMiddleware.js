const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ Middleware to protect routes (only logged-in users)
const protect = async (req, res, next) => {
    let token;

    console.log('--- Auth Middleware (Protect): START ---'); // Debug log
    console.log('Protect: Request URL:', req.originalUrl); // Debug log

    // Check if Authorization header exists and starts with "Bearer"
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log('Protect: Token received (first 10 chars):', token ? token.substring(0, 10) + '...' : 'NONE'); // Debug log

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Protect: Token decoded successfully. User ID:', decoded.id); // Debug log

            // Attach user object to request (excluding password).
            // Mongoose will include all other fields by default, including 'role'.
            req.user = await User.findById(decoded.id).select('-password');

            // If no user found (e.g., deleted from DB)
            if (!req.user) {
                console.error('Protect: User not found for decoded ID:', decoded.id); // Debug log
                return res.status(401).json({ message: 'User not found' });
            }
            console.log('Protect: User attached to request:', req.user.email, 'Role:', req.user.role); // Debug log

            next(); // Proceed to next middleware/route handler
        } catch (err) {
            console.error('❌ Protect: Invalid token or user fetch error:', err.message); // Debug log
            return res.status(401).json({ message: 'Unauthorized or invalid token' });
        }
    } else {
        console.error('Protect: No token provided in Authorization header.'); // Debug log
        return res.status(401).json({ message: 'No token provided' });
    }
    console.log('--- Auth Middleware (Protect): END ---'); // Debug log
};

// ✅ Middleware to authorize users based on role(s)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        console.log('--- Authorize Roles Middleware: START ---'); // Debug log
        console.log('Authorize Roles: Required roles:', roles); // Debug log
        console.log('Authorize Roles: User role from req.user:', req.user ? req.user.role : 'NOT AVAILABLE (req.user is undefined/null)'); // Debug log

        if (!req.user || !roles.includes(req.user.role)) {
            console.error(`❌ AuthorizeRoles: Access denied for role '${req.user ? req.user.role : 'UNDEFINED'}'. Required: ${roles.join(', ')}`); // Debug log
            return res.status(403).json({
                message: `Access denied: ${req.user ? req.user.role : 'Unknown role'}. Required roles: ${roles.join(', ')}`,
            });
        }
        console.log(`AuthorizeRoles: Access granted for role '${req.user.role}'.`); // Debug log
        next(); // Role is valid, proceed
        console.log('--- Authorize Roles Middleware: END ---'); // Debug log
    };
};

module.exports = {
    protect,
    authorizeRoles,
};
