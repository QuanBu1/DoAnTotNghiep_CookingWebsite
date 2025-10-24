const jwt = require('jsonwebtoken');

// Middleware này sẽ kiểm tra token nếu có, nhưng không bắt buộc phải có.
const softAuthMiddleware = (req, res, next) => {
    const tokenHeader = req.header('Authorization');

    // Nếu không có token, cứ đi tiếp bình thường
    if (!tokenHeader) {
        return next();
    }

    try {
        const token = tokenHeader.split(' ')[1];
        // Nếu có token và hợp lệ, giải mã và gắn thông tin người dùng vào request
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        // Nếu token không hợp lệ, cũng bỏ qua và đi tiếp
        next();
    }
};

module.exports = softAuthMiddleware;
