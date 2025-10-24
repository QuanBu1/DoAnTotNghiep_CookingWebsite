// controllers/user.js
const pool = require('../db');

// Lấy thông tin người dùng đang đăng nhập (bổ sung phone_number, address)
exports.getMe = async (req, res) => {
    try {
        const userQuery = await pool.query(
            "SELECT id, full_name, email, role, phone_number, address FROM users WHERE id = $1", // THÊM phone_number, address
            [req.user.id]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy người dùng" });
        }
        res.json({ user: userQuery.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Lỗi server");
    }
};

// Hàm: Cập nhật thông tin người dùng
exports.updateMe = async (req, res) => {
    try {
        // Tên trường đã được đồng bộ hóa từ Frontend
        const { full_name, phone_number, address } = req.body; 
        const userId = req.user.id;

        // Xử lý kiểm tra NOT NULL cho full_name
        if (!full_name || full_name.trim() === '') {
             return res.status(400).json({ msg: "Tên đầy đủ không được để trống." });
        }
        
        // Sử dụng || null để đảm bảo nếu giá trị là chuỗi rỗng (''), PostgreSQL sẽ lưu là NULL, trừ full_name.
        const updatedUser = await pool.query(
            "UPDATE users SET full_name = $1, phone_number = $2, address = $3 WHERE id = $4 RETURNING id, full_name, email, role, phone_number, address",
            [full_name, phone_number || null, address || null, userId] 
        );
        
        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy người dùng để cập nhật" });
        }

        res.json({ user: updatedUser.rows[0], msg: "Cập nhật thông tin thành công!" });
    } catch (err) {
        console.error("Lỗi khi cập nhật hồ sơ:", err.message);
        res.status(500).send("Lỗi server");
    }
};
// HÀM MỚI: Lấy thông tin công khai và công thức của một người dùng
exports.getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        // Lấy thông tin cơ bản của người dùng
        const userQuery = await pool.query(
            "SELECT id, full_name FROM users WHERE id = $1",
            [userId]
        );

        if (userQuery.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy người dùng này." });
        }
        
        const userInfo = userQuery.rows[0];

        // Lấy tất cả công thức công khai của người dùng đó
        const recipesQuery = await pool.query(
            `SELECT id, title, description, image_url 
             FROM user_recipes 
             WHERE user_id = $1 AND title IS NOT NULL AND title != ''
             ORDER BY created_at DESC`,
            [userId]
        );
        
        const userRecipes = recipesQuery.rows;

        // Trả về kết quả tổng hợp
        res.json({
            user: userInfo,
            recipes: userRecipes
        });

    } catch (err) {
        console.error("Lỗi khi lấy trang cá nhân công khai:", err.message);
        res.status(500).send("Lỗi server");
    }
};