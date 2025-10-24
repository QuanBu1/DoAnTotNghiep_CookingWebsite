// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Lấy token từ header của request
    const token = req.header('Authorization');

    // 2. Kiểm tra xem có token không
    if (!token) {
        return res.status(401).json({ msg: 'Không có token, không được phép truy cập' });
    }
    
    // Token thường có dạng "Bearer <token>". Ta cần cắt bỏ chữ "Bearer "
    const actualToken = token.split(' ')[1];

    // 3. Xác thực token
    try {
        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
        req.user = decoded.user; // Gắn thông tin người dùng vào request
        next(); // Cho phép đi tiếp
    } catch (err) {
        res.status(401).json({ msg: 'Token không hợp lệ' });
    }
};