const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const port = Number(process.env.EMAIL_PORT) || 587;
    const isSecure = port === 465;

    // 1) Create transporter with timeouts
    const transporter = nodemailer.createTransport({
        service: 'gmail', // يحدد تلقائياً أفضل إعدادات لـ Gmail
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: port,
        secure: isSecure,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
        connectionTimeout: 10000, // 10 ثوانٍ كحد أقصى لتجنب تعليق الطلب
        greetingTimeout: 10000,
        socketTimeout: 15000,
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