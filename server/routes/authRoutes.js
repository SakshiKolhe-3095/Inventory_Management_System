// server/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile, // Import new function
  updateUserPassword, // Import new function
  logoutUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile); // New route for updating profile
router.put('/password', protect, updateUserPassword); // New route for changing password
router.post('/logout', logoutUser);

module.exports = router;
