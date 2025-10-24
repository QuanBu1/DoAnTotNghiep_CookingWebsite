// services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendReplyEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"Bếp của Quân" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html, // Gửi nội dung dạng HTML để có thể định dạng đẹp hơn
        });
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Could not send email.');
    }
};

module.exports = { sendReplyEmail };