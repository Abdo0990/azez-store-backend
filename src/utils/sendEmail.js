const sendEmail = async (options) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: {
                name: 'Azez Store',
                email: process.env.BREVO_SENDER_EMAIL, // البريد الذي سجلت به حساب Brevo
            },
            to: [
                {
                    email: options.email,
                },
            ],
            subject: options.subject,
            htmlContent: options.html || options.message,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to send email via Brevo');
    }

    return data;
};

module.exports = sendEmail;