const pool = require('../db');

// Lấy chi tiết một bài học (kèm ảnh)
exports.getLessonById = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const lessonResult = await pool.query("SELECT * FROM lessons WHERE id = $1", [lessonId]);
        if (!lessonId || isNaN(parseInt(lessonId))) {
             return res.status(400).json({ msg: "ID bài học không hợp lệ." });
        }
        const lesson = lessonResult.rows[0];
        const imagesResult = await pool.query("SELECT * FROM lesson_images WHERE lesson_id = $1 ORDER BY id ASC", [lessonId]);
        lesson.images = imagesResult.rows;
        res.json(lesson);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

// ==========================================================
// === HÀM CẬP NHẬT BÀI HỌC (ĐÃ SỬA LỖI VÀ HOÀN THIỆN) ===
// ==========================================================
exports.updateLesson = async (req, res) => {
    const { lessonId } = req.params;
    const { title, video_url, content, image_urls } = req.body;

    // Bắt buộc phải có tiêu đề và nội dung
    if (!title || !content) {
        return res.status(400).json({ msg: "Vui lòng nhập tiêu đề và nội dung." });
    }

    const client = await pool.connect();
    try {
        // Bắt đầu một transaction để đảm bảo toàn vẹn dữ liệu
        await client.query('BEGIN');

        // 1. Cập nhật các thông tin chính của bài học
        const updatedLesson = await client.query(
            "UPDATE lessons SET title = $1, video_url = $2, content = $3 WHERE id = $4 RETURNING *",
            [title, video_url, content, lessonId]
        );

        if (updatedLesson.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: "Không tìm thấy bài học để cập nhật" });
        }

        // 2. Xóa tất cả các ảnh cũ liên quan đến bài học này
        await client.query("DELETE FROM lesson_images WHERE lesson_id = $1", [lessonId]);

        // 3. Thêm lại danh sách ảnh mới (nếu có)
        if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
            for (const imageUrl of image_urls) {
                // Chỉ thêm nếu URL không phải là chuỗi rỗng
                if (imageUrl.trim() !== '') {
                    await client.query(
                        "INSERT INTO lesson_images (image_url, lesson_id) VALUES ($1, $2)",
                        [imageUrl.trim(), lessonId]
                    );
                }
            }
        }

        // 4. Nếu mọi thứ thành công, xác nhận transaction
        await client.query('COMMIT');

        // Trả về bài học đã được cập nhật
        res.json(updatedLesson.rows[0]);

    } catch (err) {
        // Nếu có lỗi, hủy bỏ tất cả thay đổi
        await client.query('ROLLBACK');
        console.error("Lỗi khi cập nhật bài học:", err.message);
        res.status(500).send('Lỗi server');
    } finally {
        // Luôn giải phóng client sau khi hoàn thành
        client.release();
    }
};


// Xóa một bài học (Hàm này không đổi)
exports.deleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const deleteResult = await pool.query("DELETE FROM lessons WHERE id = $1", [lessonId]);
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ msg: "Không tìm thấy bài học để xóa" });
        }
        res.json({ msg: "Bài học đã được xóa" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

/**
 * @route   POST /api/lessons/:courseId/:lessonId/complete
 * @desc    Đánh dấu một bài học là đã hoàn thành
 * @access  Private (Chỉ người đã ghi danh)
 */
exports.markAsComplete = async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user.id;

    try {
        const existingCompletion = await pool.query(
            "SELECT * FROM lesson_completions WHERE user_id = $1 AND lesson_id = $2",
            [userId, lessonId]
        );
        if (existingCompletion.rows.length === 0) {
            await pool.query(
                "INSERT INTO lesson_completions (user_id, lesson_id) VALUES ($1, $2)",
                [userId, lessonId]
            );
        }
        res.json({ msg: "Đã đánh dấu bài học là hoàn thành." });
    } catch (err) {
        console.error('Lỗi khi đánh dấu hoàn thành:', err);
        res.status(500).send('Lỗi server');
    }
};
/**
 * @route   POST /api/lessons/:courseId/:lessonId/submit
 * @desc    Học viên nộp bài thực hành
 * @access  Private (Chỉ student đã ghi danh)
 */
exports.submitPractice = async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const { imageUrl, studentComment } = req.body;

    if (!imageUrl) {
        return res.status(400).json({ msg: 'Vui lòng cung cấp hình ảnh bài thực hành.' });
    }

    try {
        // Kiểm tra xem đã nộp bài cho lesson này chưa
        const existingSubmission = await pool.query(
            "SELECT id FROM practice_submissions WHERE user_id = $1 AND lesson_id = $2",
            [userId, lessonId]
        );

        if (existingSubmission.rows.length > 0) {
            return res.status(400).json({ msg: 'Bạn đã nộp bài cho bài học này rồi.' });
        }

        const newSubmission = await pool.query(
            "INSERT INTO practice_submissions (user_id, lesson_id, image_url, student_comment) VALUES ($1, $2, $3, $4) RETURNING *",
            [userId, lessonId, imageUrl, studentComment]
        );

        res.status(201).json(newSubmission.rows[0]);
    } catch (err) {
        console.error('Lỗi khi nộp bài thực hành:', err);
        res.status(500).send('Lỗi server');
    }
};
/**
 * @route   GET /api/lessons/:courseId/:lessonId/submission
 * @desc    Học viên lấy bài nộp của mình cho một bài học
 * @access  Private (Chỉ student đã ghi danh)
 */
exports.getSubmissionForStudent = async (req, res) => {
    const { lessonId } = req.params;
    const userId = req.user.id;

    try {
        const submissionQuery = await pool.query(
            "SELECT * FROM practice_submissions WHERE user_id = $1 AND lesson_id = $2",
            [userId, lessonId]
        );

        if (submissionQuery.rows.length === 0) {
            return res.status(404).json({ msg: 'Bạn chưa nộp bài cho bài học này.' });
        }

        res.json(submissionQuery.rows[0]);
    } catch (err) {
        console.error('Lỗi khi lấy bài nộp của học viên:', err);
        res.status(500).send('Lỗi server');
    }
};