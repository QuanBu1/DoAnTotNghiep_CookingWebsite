// controllers/notificationController.js
const pool = require('../db');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await pool.query(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10",
            [userId]
        );
        res.json(notifications.rows);
    } catch (err) {
        res.status(500).send("Lỗi server");
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        // Cập nhật tất cả thông báo của user thành đã đọc
        await pool.query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE",
            [userId]
        );
        res.json({ msg: "Đã đánh dấu tất cả là đã đọc." });
    } catch (err) {
        res.status(500).send("Lỗi server");
    }
};