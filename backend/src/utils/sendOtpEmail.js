const axios = require('axios');

const sendOtpEmail = async (email, otp) => {
    const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
            sender: {
                name: 'CampusCourier',
                email: process.env.EMAIL_USER, // your verified sender email in Brevo
            },
            to: [{ email }],
            subject: `${otp} is your CampusCourier verification code`,
            htmlContent: `
                <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 16px; border: 1px solid #E5E7EB;">
                    <h2 style="color: #4F46E5; margin-bottom: 4px;">📦 CampusCourier</h2>
                    <p style="color: #6B7280; font-size: 14px; margin-bottom: 28px;">Campus deliveries, powered by students</p>

                    <p style="color: #111827; font-size: 16px;">Your verification code is:</p>

                    <div style="background: #EEF2FF; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
                        <span style="font-size: 40px; font-weight: 800; color: #4F46E5; letter-spacing: 8px;">${otp}</span>
                    </div>

                    <p style="color: #6B7280; font-size: 13px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
                    <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
            `,
        },
        {
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json',
            },
        }
    );

    return response.data;
};

module.exports = sendOtpEmail;
