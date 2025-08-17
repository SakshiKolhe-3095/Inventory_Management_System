const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');
const mongoose = require('mongoose');

// Helper function to determine the effective low stock threshold for a product
// Product-specific threshold > Category default threshold > Global default (50)
const getEffectiveLowStockThreshold = async (product) => {
    if (product.lowStockThreshold !== undefined && product.lowStockThreshold !== null) {
        return product.lowStockThreshold;
    }

    let categoryDoc = product.category;
    if (product.category && typeof product.category === 'string' && mongoose.Types.ObjectId.isValid(product.category)) {
        categoryDoc = await Category.findById(product.category);
    } else if (product.category && typeof product.category === 'object' && product.category._id) {
        categoryDoc = product.category;
    }

    if (categoryDoc && categoryDoc.defaultLowStockThreshold !== undefined && categoryDoc.defaultLowStockThreshold !== null) {
        return categoryDoc.defaultLowStockThreshold;
    }

    return 50; // Global default if no specific or category threshold is set
};

// @desc    Get all products that are below their low stock threshold
// @route   GET /api/reports/low-stock
// @access  Private (Admin only)
const getLowStockProducts = async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized: Only administrators can view low stock reports.' });
    }

    try {
        const products = await Product.find({}).populate('category', 'name defaultLowStockThreshold');
        const lowStockItems = [];
        for (const product of products) {
            const effectiveThreshold = await getEffectiveLowStockThreshold(product);
            if (product.stock <= effectiveThreshold) {
                lowStockItems.push({
                    _id: product._id,
                    name: product.name,
                    sku: product.sku,
                    stock: product.stock,
                    lowStockThreshold: effectiveThreshold,
                    category: product.category ? product.category.name : 'N/A',
                    binLocation: product.binLocation || 'N/A',
                    lastUpdated: product.updatedAt,
                });
            }
        }
        res.status(200).json(lowStockItems);
    } catch (err) {
        console.error('Error fetching low stock products:', err);
        res.status(500).json({ message: 'Server error while fetching low stock products.' });
    }
};

// @desc    Get count of products that are below their low stock threshold
// @route   GET /api/reports/low-stock-count
// @access  Private (Admin only)
const getLowStockCount = async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized: Only administrators can view low stock count.' });
    }

    try {
        const products = await Product.find({}).populate('category', 'name defaultLowStockThreshold');
        let lowStockCount = 0;
        for (const product of products) {
            const effectiveThreshold = await getEffectiveLowStockThreshold(product);
            if (product.stock <= effectiveThreshold) {
                lowStockCount++;
            }
        }
        res.status(200).json({ count: lowStockCount });
    } catch (err) {
        console.error('Error fetching low stock count:', err);
        res.status(500).json({ message: 'Server error while fetching low stock count.' });
    }
};

// @desc    Send low stock alerts via email (for all low stock items - typically for cron job)
// @route   POST /api/reports/send-all-low-stock-alerts (triggered manually or by cron)
// @access  Private (Admin only, or internal system call)
const sendAllLowStockAlerts = async (req, res) => {
    if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized: Only administrators can trigger alerts manually.' });
    }

    try {
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
                    category: product.category ? product.category.name : 'N/A',
                    binLocation: product.binLocation || 'N/A',
                });
            }
        }

        if (lowStockItems.length === 0) {
            return res.status(200).json({ message: 'No low stock items found. No alerts sent.' });
        }

        const alertRecipients = await User.find({
            'notificationPreferences.receiveLowStockAlerts': true,
            role: 'admin'
        });

        if (alertRecipients.length === 0) {
            return res.status(200).json({ message: 'No administrators subscribed to low stock alerts.' });
        }

        const emailPromises = alertRecipients.map(async (user) => {
            const recipientEmail = user.notificationPreferences.lowStockAlertEmail || user.email;
            if (!recipientEmail || !/.+@.+\..+/.test(recipientEmail)) {
                console.warn(`Skipping alert for user ${user.name} due to invalid or missing alert email.`);
                return null;
            }

            const subject = 'Urgent: Low Stock Alert in Inventory System';
            let emailContent = `
                <p style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">Dear ${user.name},</p>
                <p style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">The following products are currently running low on stock:</p>
                <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse; border: 1px solid #ddd; font-family: Arial, sans-serif;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Product Name</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">SKU</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Current Stock</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Threshold</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Category</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Bin Location</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            lowStockItems.forEach(item => {
                emailContent += `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.sku}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #d9534f; font-weight: bold;">${item.currentStock}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.threshold}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.category}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.binLocation}</td>
                    </tr>
                `;
            });
            emailContent += `
                    </tbody>
                </table>
                <p style="margin-top: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">Please take necessary action to replenish these items.</p>
                <p style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">Regards,<br>Your Inventory Management System</p>
            `;

            try {
                await sendEmail({
                    to: recipientEmail,
                    subject: subject,
                    html: emailContent,
                });
                // console.log(`Low stock alert sent to ${recipientEmail}`); // Removed debug log
                return { email: recipientEmail, status: 'sent' };
            } catch (emailErr) {
                console.error(`Failed to send low stock email to ${recipientEmail}:`, emailErr);
                return { email: recipientEmail, status: 'failed', error: emailErr.message };
            }
        });

        const results = await Promise.all(emailPromises);
        res.status(200).json({
            message: 'Low stock alert process completed.',
            sentCount: results.filter(r => r && r.status === 'sent').length,
            failedCount: results.filter(r => r && r.status === 'failed').length,
            details: results.filter(r => r !== null),
        });

    } catch (err) {
        console.error('Error sending all low stock alerts:', err);
        res.status(500).json({ message: 'Server error while sending all low stock alerts.' });
    }
};


// @desc    Manually send a low stock alert for a SPECIFIC product
// @route   POST /api/reports/low-stock/alert/:productId
// @access  Private (Admin only)
const sendSingleLowStockAlert = async (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized: Only administrators can trigger single product alerts.' });
    }

    const { productId } = req.params;

    try {
        const product = await Product.findById(productId).populate('category', 'name defaultLowStockThreshold');

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const effectiveThreshold = await getEffectiveLowStockThreshold(product);
        if (product.stock > effectiveThreshold) {
            return res.status(200).json({ message: `Product ${product.name} is not currently below its low stock threshold (${product.stock} > ${effectiveThreshold}). No alert sent.` });
        }

        const alertRecipients = await User.find({
            'notificationPreferences.receiveLowStockAlerts': true,
            role: 'admin'
        });

        if (alertRecipients.length === 0) {
            return res.status(200).json({ message: 'No administrators subscribed to low stock alerts.' });
        }

        const emailSubject = `Urgent: Low Stock Alert for ${product.name}`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #d9534f;">Low Stock Alert!</h2>
                <p>The product <strong>${product.name}</strong> (SKU: ${product.sku}) is currently low in stock:</p>
                <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse; border: 1px solid #ddd; font-family: Arial, sans-serif;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Product Name</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">SKU</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Current Stock</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Threshold</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Category</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Bin Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${product.name}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${product.sku}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #d9534f; font-weight: bold;">${product.stock}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${effectiveThreshold}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${product.category?.name || 'N/A'}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${product.binLocation || 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>
                <p style="margin-top: 20px; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">Please take necessary action to restock this item.</p>
                <p style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">Regards,<br/>Your Inventory System</p>
            </div>
        `;

        let emailsSentCount = 0;
        for (const recipient of alertRecipients) {
            const recipientEmail = recipient.notificationPreferences.lowStockAlertEmail || recipient.email;
            if (!recipientEmail || !/.+@.+\..+/.test(recipientEmail)) {
                console.warn(`Skipping single alert for user ${recipient.name} due to invalid or missing alert email.`);
                continue;
            }
            try {
                await sendEmail({
                    to: recipientEmail,
                    subject: emailSubject,
                    html: emailHtml,
                    text: `Low stock alert for product: ${product.name}. Current Stock: ${product.stock}, Threshold: ${effectiveThreshold}.`
                });
                emailsSentCount++;
            } catch (emailError) {
                console.error(`Failed to send single alert email to ${recipientEmail} for product ${product.name}:`, emailError);
            }
        }

        if (emailsSentCount > 0) {
            res.status(200).json({ message: `Low stock alert sent for product ${product.name} to ${emailsSentCount} recipient(s).` });
        } else {
            res.status(500).json({ message: 'No alerts were successfully sent for this product. Check email service configuration or recipient settings.' });
        }

    } catch (err) {
        console.error('Error sending single low stock alert:', err);
        res.status(500).json({ message: 'Server error while sending single low stock alert.', error: err.message });
    }
};


module.exports = {
    getLowStockProducts,
    getLowStockCount,
    sendAllLowStockAlerts,
    sendSingleLowStockAlert,
};
