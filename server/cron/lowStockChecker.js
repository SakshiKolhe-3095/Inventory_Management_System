const cron = require('node-cron');
const Product = require('../models/Product');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');
const Category = require('../models/Category'); // Ensure Category is imported for threshold logic

// Helper function to determine the effective low stock threshold for a product
const getEffectiveLowStockThreshold = async (product) => {
    if (product.lowStockThreshold !== undefined && product.lowStockThreshold !== null) {
        return product.lowStockThreshold;
    }

    let categoryDoc = product.category;
    // If product.category is an ObjectId string (not populated yet), fetch the category
    if (product.category && typeof product.category === 'string') {
        categoryDoc = await Category.findById(product.category);
    } else if (product.category && typeof product.category === 'object' && product.category._id) {
        // If it's already a populated object, use it directly
        categoryDoc = product.category;
    }

    if (categoryDoc && categoryDoc.defaultLowStockThreshold !== undefined && categoryDoc.defaultLowStockThreshold !== null) {
        return categoryDoc.defaultLowStockThreshold;
    }

    return 50; // Global default if no specific or category threshold is set
};

// Function to check for low stock products and send alerts
const checkLowStockAndSendAlerts = async () => {
    try {
        // Find all products and populate category to get defaultLowStockThreshold
        const products = await Product.find({}).populate('category', 'name defaultLowStockThreshold');
        const lowStockItems = [];

        for (const product of products) {
            const effectiveThreshold = await getEffectiveLowStockThreshold(product);
            if (product.stock <= effectiveThreshold) {
                lowStockItems.push({
                    name: product.name,
                    sku: product.sku,
                    currentStock: product.stock,
                    threshold: effectiveThreshold,
                    category: product.category ? product.category.name : 'N/A', // Use populated name
                    binLocation: product.binLocation || 'N/A',
                });
            }
        }

        if (lowStockItems.length === 0) {
            return;
        }

        // Fetch all users who have opted in for low stock alerts and are admins
        const alertRecipients = await User.find({
            'notificationPreferences.receiveLowStockAlerts': true,
            role: 'admin', // Only send to admins who opted in
            'notificationPreferences.lowStockAlertEmail': { $ne: null, $ne: '' } // Ensure email is set
        });

        if (alertRecipients.length === 0) {
            return;
        }

        const emailSubject = 'Urgent: Low Stock Alert in Inventory System';
        let emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #d9534f;">Low Stock Alert!</h2>
                <p>The following products are currently running low in your inventory:</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product Name</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">SKU</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Category</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Current Stock</th>
                            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Threshold</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        lowStockItems.forEach(item => {
            emailHtml += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.sku}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.category}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; color: #d9534f; font-weight: bold;">${item.currentStock}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${item.threshold}</td>
                </tr>
            `;
        });

        emailHtml += `
                    </tbody>
                </table>
                <p style="margin-top: 20px;">Please take necessary action to restock these items.</p>
                <p>Regards,<br/>Your Inventory System</p>
            </div>
        `;

        // Send email to each recipient
        for (const recipient of alertRecipients) {
            try {
                await sendEmail({
                    to: recipient.notificationPreferences.lowStockAlertEmail,
                    subject: emailSubject,
                    html: emailHtml,
                    text: `Low stock alert for products: ${lowStockItems.map(p => p.name).join(', ')}. Please check your inventory.`
                });
                // console.log(`Low stock alert sent to: ${recipient.notificationPreferences.lowStockAlertEmail}`); // Removed debug log
            } catch (emailError) {
                console.error(`Failed to send low stock alert to ${recipient.notificationPreferences.lowStockAlertEmail}:`, emailError);
            }
        }

        // console.log('Low stock check cron job completed.'); // Removed debug log

    } catch (error) {
        console.error('Error during low stock check cron job:', error);
    }
};

// Schedule the cron job to run daily at 9:00 AM
const startLowStockChecker = () => {
    cron.schedule('0 9 * * *', () => { // Runs daily at 9:00 AM
        checkLowStockAndSendAlerts();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });
    // console.log('Low stock checker cron job scheduled to run daily at 9:00 AM (Asia/Kolkata timezone).'); // Removed debug log
};

module.exports = {
    startLowStockChecker,
    checkLowStockAndSendAlerts
};
