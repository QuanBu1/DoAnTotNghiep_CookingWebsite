// controllers/profile.js

const pool = require('../db');

/**
 * @route   GET /api/profile/favorites
 * @desc    Lấy danh sách các khóa học yêu thích của người dùng
 * @access  Private
 */
exports.getFavoriteCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        const favoriteCourses = await pool.query(
            `SELECT c.*, u.full_name AS instructor_name 
             FROM courses c
             JOIN users u ON c.instructor_id = u.id
             JOIN favorite_courses f ON c.id = f.course_id
             WHERE f.user_id = $1`,
            [userId]
        );
        res.json(favoriteCourses.rows);
    } catch (err) {
        console.error("Lỗi khi lấy danh sách yêu thích:", err.message);
        res.status(500).send('Lỗi server');
    }
};

/**
 * @route   GET /api/profile/enrolled-courses
 * @desc    Lấy danh sách các khóa học đã ghi danh và tiến độ
 * @access  Private
 */
exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id;
        const enrolledCoursesQuery = await pool.query(
            `SELECT 
                c.*, 
                u.full_name AS instructor_name,
                COALESCE(progress.completed_lessons, 0) as completed_lessons,
                COALESCE(total.total_lessons, 0) as total_lessons,
                CASE 
                    WHEN COALESCE(total.total_lessons, 0) > 0 THEN
                        (COALESCE(progress.completed_lessons, 0) * 100.0 / total.total_lessons)
                    ELSE 0 
                END as progress_percentage
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            JOIN users u ON c.instructor_id = u.id
            LEFT JOIN (
                SELECT course_id, COUNT(id) as total_lessons 
                FROM lessons 
                GROUP BY course_id
            ) AS total ON c.id = total.course_id
            LEFT JOIN (
                SELECT l.course_id, COUNT(lc.lesson_id) as completed_lessons
                FROM lesson_completions lc
                JOIN lessons l ON lc.lesson_id = l.id
                WHERE lc.user_id = $1
                GROUP BY l.course_id
            ) AS progress ON c.id = progress.course_id
            WHERE e.user_id = $1 AND e.status = 'da xac nhan'
            -- === DÒNG GÂY LỖI ĐÃ ĐƯỢC SỬA TẠI ĐÂY ===
            -- Sắp xếp theo ID của lần ghi danh để đảm bảo tính nhất quán
            ORDER BY e.id DESC`,
            [userId]
        );

        res.json(enrolledCoursesQuery.rows);
    } catch (err) {
        console.error("Lỗi khi lấy khóa học đã ghi danh:", err.message);
        res.status(500).send('Lỗi server');
    }
};