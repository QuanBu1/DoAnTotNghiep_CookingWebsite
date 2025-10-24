const pool = require('../db');

const checkCourseOwner = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role; // Lấy vai trò của người dùng từ token

        // === QUY TẮC MỚI: ƯU TIÊN ADMIN ===
        // Nếu người dùng là admin, cho phép truy cập ngay lập tức
        if (userRole === 'admin') {
            return next();
        }
        // ===================================

        const course = await pool.query(
            "SELECT instructor_id FROM courses WHERE id = $1",
            [courseId]
        );

        if (course.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy khóa học" });
        }

        // Với những người khác, kiểm tra quyền sở hữu như cũ
        if (course.rows[0].instructor_id !== userId) {
            return res.status(403).json({ msg: "Bạn không có quyền thực hiện hành động này" });
        }

        next();

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

module.exports = checkCourseOwner;