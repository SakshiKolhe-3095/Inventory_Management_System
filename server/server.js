// server.js

// ✅ IMPORTANT: Load environment variables FIRST and verify immediately
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Ensure this is installed: npm install cookie-parser
const cron = require('node-cron'); // Ensure node-cron is installed
const { checkLowStockAndSendAlerts } = require('./cron/lowStockChecker'); // Correct import for cron job
const path = require('path'); // For serving static files

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userManagementRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const orderRoutes = require('./routes/orderRoutes');     // ✅ Ensure this is imported
const supplierRoutes = require('./routes/supplierRoutes'); // ✅ Ensure this is imported

const app = express();

// --- Middleware ---
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: false })); // Body parser for URL-encoded data
app.use(cookieParser()); // Cookie parser

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from your frontend
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
}));

// --- Database Connection ---
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};
connectDB();

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/orders', orderRoutes);     // ✅ Ensure this route is used
app.use('/api/suppliers', supplierRoutes); // ✅ Ensure this route is used

// --- Cron Job Scheduling ---
// Schedule the low stock checker to run daily at 9:00 AM (Asia/Kolkata timezone)
cron.schedule('0 9 * * *', async () => {
    console.log('Running low stock check cron job...');
    await checkLowStockAndSendAlerts();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

// Initial run of the low stock checker on server start
// This is useful for testing or ensuring it runs immediately on deployment
(async () => {
    console.log('Initial low stock check on server startup...');
    await checkLowStockAndSendAlerts();
})();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
