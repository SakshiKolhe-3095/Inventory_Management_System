// server/utils/generateToken.js

const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token (JWT) for user authentication.
 * The token includes the user's ID and role, and is signed with a secret from environment variables.
 *
 * @param {string} id - The user's MongoDB ObjectId.
 * @param {string} role - The user's role (e.g., 'admin', 'client').
 * @returns {string} The signed JWT.
 */
const generateToken = (id, role) => {
  // Ensure JWT_SECRET is defined in your .env file
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    // In a production app, you might want to throw an error or exit the process here.
    // For development, we'll proceed but log the issue.
    throw new Error('JWT_SECRET is not defined.');
  }

  return jwt.sign(
    { id, role }, // Payload: include both ID and role
    process.env.JWT_SECRET, // Secret key for signing the token
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Token expiration (e.g., '1h', '7d')
    }
  );
};

module.exports = generateToken;
