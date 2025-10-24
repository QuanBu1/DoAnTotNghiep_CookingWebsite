const adminMiddleware = (req, res, next) => {
    // Middleware này nên được dùng SAU authMiddleware,
    // nên chúng ta có thể tin rằng req.user đã tồn tại.
    if (req.user && req.user.role === 'admin') {
        next(); // Nếu là admin, cho đi tiếp
    } else {
        res.status(403).json({ msg: 'Truy cập bị từ chối. Yêu cầu quyền Admin.' });
    }
};

module.exports = adminMiddleware;