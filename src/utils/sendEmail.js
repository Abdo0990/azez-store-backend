const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // إجبار الاتصال على IPv4 ومنفذ 587 لتفادي حظر شبكات Render
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // false لاستخدام STARTTLS على منفذ 587
        requireTLS: true,
        family: 4, // إجبار الاتصال عبر IPv4 لمنع خطأ ENETUNREACH
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
    });

    const mailOptions = {
        from: `"Azez Store" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html || options.message,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;