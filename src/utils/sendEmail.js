const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1) Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT, // 465 or 587
        secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // 2) Define email options
    const mailOptions = {
        from: `"Azez Store" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html || options.message,
    };

    // 3) Send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;