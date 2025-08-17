const nodemailer = require('nodemailer');

// Configure your email transporter using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Function to send email
const sendEmail = async (options) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM, // Sender address from .env
        to: options.to, // List of receivers
        subject: options.subject, // Subject line
        html: options.html, // HTML body
        text: options.text, // Plain text body (optional, but good for fallback)
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        // Log more details about the error if available from Nodemailer/SendGrid
        if (error.response) {
            console.error('SendGrid API Response:', error.response);
        } else if (error.command) {
            console.error('Nodemailer Command Error:', {
                command: error.command,
                code: error.code,
                errno: error.errno,
                syscall: error.syscall,
                address: error.address,
                port: error.port
            });
        }
        throw new Error('Email sending failed.');
    }
};

module.exports = sendEmail;
