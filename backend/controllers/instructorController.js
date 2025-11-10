// controllers/instructorController.js
const pool = require('../db');

// Lấy tất cả các khóa học thuộc về giảng viên đang đăng nhập
exports.getMyCourses = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const courses = await pool.query(
            "SELECT c.*, u.full_name AS instructor_name FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.instructor_id = $1 ORDER BY c.id DESC",
            [instructorId]
        );
        res.json(courses.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

/**
 * @route   GET /api/instructor/submissions
 * @desc    Giảng viên lấy TẤT CẢ bài nộp của các khóa học mình dạy
 * @access  Private (Instructor)
 */
exports.getSubmissions = async (req, res) => {
    const instructorId = req.user.id;
    try {
        const submissions = await pool.query(`
            SELECT 
                ps.id, ps.image_url, ps.student_comment, ps.submitted_at, ps.status,
                u.full_name as student_name,
                l.title as lesson_title,
                c.title as course_title
            FROM practice_submissions ps
            JOIN users u ON ps.user_id = u.id
            JOIN lessons l ON ps.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE c.instructor_id = $1
            ORDER BY ps.status ASC, ps.submitted_at ASC
        `, [instructorId]);

        res.json(submissions.rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách bài nộp:', err);
        res.status(500).send('Lỗi server');
    }
};

/**
 * @route   PUT /api/instructor/submissions/:submissionId/grade
 * @desc    Giảng viên chấm một bài nộp (ĐÃ NÂNG CẤP ĐỂ GỬI THÔNG BÁO)
 * @access  Private (Instructor)
 */
exports.gradeSubmission = async (req, res) => {
    const { submissionId } = req.params;
    const { status, feedback } = req.body;
    const instructorId = req.user.id;

    if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ msg: 'Trạng thái chấm bài không hợp lệ.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const submissionQuery = await client.query(`
            SELECT 
                ps.user_id,
                l.id as lesson_id,
                l.title as lesson_title,
                c.id as course_id,
                c.instructor_id
            FROM practice_submissions ps 
            JOIN lessons l ON ps.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE ps.id = $1
        `, [submissionId]);

        if (submissionQuery.rows.length === 0 || submissionQuery.rows[0].instructor_id !== instructorId) {
            await client.query('ROLLBACK');
            return res.status(403).json({ msg: 'Bạn không có quyền chấm bài này.' });
        }
        
        const submissionInfo = submissionQuery.rows[0];

        const gradedSubmission = await client.query(
            "UPDATE practice_submissions SET status = $1, instructor_feedback = $2, graded_at = NOW() WHERE id = $3 RETURNING *",
            [status, feedback, submissionId]
        );

        // --- BẮT ĐẦU LOGIC GỬI THÔNG BÁO ---
        const message = `Bài thực hành "${submissionInfo.lesson_title}" của bạn đã được chấm.`;
        const link = `/courses/${submissionInfo.course_id}/lessons/${submissionInfo.lesson_id}`;
        const type = 'submission_graded';
        const studentId = submissionInfo.user_id;

        const newNotification = await client.query(
            "INSERT INTO notifications (user_id, message, link, type) VALUES ($1, $2, $3, $4) RETURNING *",
            [studentId, message, link, type]
        );
        
        const sendNotification = req.app.get('sendNotification');
        if (sendNotification) {
            sendNotification(studentId, newNotification.rows[0]);
        }
        // --- KẾT THÚC LOGIC GỬI THÔNG BÁO ---

        await client.query('COMMIT');
        res.json(gradedSubmission.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Lỗi khi chấm bài:', err);
        res.status(500).send('Lỗi server');
    } finally {
        client.release();
    }
};
/**
 * @route   GET /api/instructor/comments
 * @desc    Giảng viên lấy TẤT CẢ bình luận (hỏi đáp) từ các khóa học của mình
 * @access  Private (Instructor)
 */
exports.getInstructorComments = async (req, res) => {
    const instructorId = req.user.id;
    try {
        // Sử dụng truy vấn tương tự Admin nhưng lọc theo instructor_id
        // và chỉ lấy các bình luận không phải của chính giảng viên
        const combinedQuery = `
            SELECT 'thread' as type, t.id, t.question_text as text, u.full_name as author, t.created_at, l.title as lesson_title, c.id as course_id, l.id as lesson_id
            FROM q_and_a_threads t
            JOIN users u ON t.user_id = u.id
            JOIN lessons l ON t.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE c.instructor_id = $1 AND t.user_id != $1
            UNION ALL
            SELECT 'reply' as type, r.id, r.reply_text as text, u.full_name as author, r.created_at, l.title as lesson_title, c.id as course_id, l.id as lesson_id
            FROM q_and_a_replies r
            JOIN users u ON r.user_id = u.id
            JOIN q_and_a_threads t ON r.thread_id = t.id
            JOIN lessons l ON t.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE c.instructor_id = $1 AND r.user_id != $1
        `;

        const dataResult = await pool.query(
            `SELECT * FROM (${combinedQuery}) AS combined ORDER BY created_at DESC LIMIT 50`, // Giới hạn 50 bình luận mới nhất
            [instructorId]
        );

        res.json(dataResult.rows);
    } catch (err) {
        console.error("Lỗi khi lấy danh sách bình luận của giảng viên:", err.message);
        res.status(500).send('Lỗi server');
    }
};