// server/config/db.js

// Import mongoose for MongoDB object modeling
const mongoose = require('mongoose');

// Function to connect to the MongoDB database
const connectDB = async () => {
    try {
        // Attempt to connect to MongoDB using the URI from environment variables
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // These options are recommended to avoid deprecation warnings
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Log a success message if connection is established
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // Log an error message if connection fails
        console.error(`Error: ${error.message}`);
        // Exit the process with a failure code
        process.exit(1);
    }
};

// Export the connectDB function so it can be used in other files (like server.js)
module.exports = connectDB;

