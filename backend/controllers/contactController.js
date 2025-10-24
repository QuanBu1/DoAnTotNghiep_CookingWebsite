// controllers/contactController.js
const pool = require('../db');

// Gửi một tin nhắn liên hệ mới
exports.submitMessage = async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ msg: 'Vui lòng nhập đầy đủ họ tên, email và nội dung tin nhắn.' });
    }

    try {
        await pool.query(
            "INSERT INTO contact_messages (sender_name, sender_email, subject, message) VALUES ($1, $2, $3, $4)",
            [name, email, subject, message]
        );
        res.status(201).json({ msg: 'Gửi tin nhắn thành công! Chúng tôi sẽ sớm phản hồi cho bạn.' });
    } catch (err) {
        console.error("Lỗi khi gửi tin nhắn liên hệ:", err.message);
        res.status(500).send('Lỗi server');
    }
};