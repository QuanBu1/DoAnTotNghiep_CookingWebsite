// middleware/instructorMiddleware.js
module.exports = function(req, res, next) {
    if (req.user && req.user.role === 'instructor') {
        next(); // Nếu là giảng viên, cho đi tiếp
    } else {
        res.status(403).json({ msg: 'Truy cập bị cấm, bạn không phải là giảng viên' });
    }
};