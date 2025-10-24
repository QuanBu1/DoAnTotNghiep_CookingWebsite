const pool = require('../db');

const checkEnrollment = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const course = await pool.query(
            "SELECT instructor_id FROM courses WHERE id = $1",
            [courseId]
        );

        if (course.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy khóa học" });
        }

        const instructorId = course.rows[0].instructor_id;

        if (userRole === 'admin' || userId === instructorId) {
            return next();
        }

        const enrollment = await pool.query(
            "SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2",
            [userId, courseId]
        );

        if (enrollment.rows.length > 0) {
            return next();
        }

        return res.status(403).json({ msg: "Bạn chưa ghi danh vào khóa học này." });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

module.exports = checkEnrollment;