const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
    const { data, error } = await resend.emails.send({
        from: 'Azez Store <onboarding@resend.dev>', // النطاق الافتراضي المجاني من Resend
        to: options.email,
        subject: options.subject,
        html: options.html || options.message,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

module.exports = sendEmail;