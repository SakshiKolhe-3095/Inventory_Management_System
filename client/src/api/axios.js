// client/src/api/axios.js

import axios from 'axios';

// Create an Axios instance with a base URL
const API = axios.create({
    baseURL: 'http://localhost:5000/api', // IMPORTANT: Ensure this matches your backend URL
    withCredentials: true, // If you plan to send cookies (e.g., for refresh tokens)
});

// Request interceptor to add the JWT token to headers before each request
API.interceptors.request.use(
    (config) => {
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        if (token) {
            // If token exists, add it to the Authorization header as a Bearer token
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config; // Return the modified config
    },
    (error) => {
        // Handle request errors
        return Promise.reject(error);
    }
);

// Response interceptor (optional, but useful for global error handling or refresh tokens)
API.interceptors.response.use(
    (response) => response, // Just return the response if successful
    (error) => {
        // Handle global errors, e.g., 401 Unauthorized
        if (error.response && error.response.status === 401) {
            // Optionally, redirect to login or clear token if unauthorized
            console.error('Unauthorized request. Token might be invalid or expired.');
            // Example: localStorage.removeItem('token');
            // Example: window.location.href = '/login'; // Redirect to login page
        }
        return Promise.reject(error); // Propagate the error
    }
);

export default API; // Export the configured Axios instance

