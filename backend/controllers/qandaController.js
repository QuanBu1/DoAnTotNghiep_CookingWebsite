// controllers/qandaController.js
const pool = require('../db');

// Lấy tất cả các chuỗi bình luận (threads và replies) cho một bài học
exports.getThreadsForLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;

        // Lấy tất cả các câu hỏi gốc (threads)
        const threadsQuery = await pool.query(
            `SELECT 
                t.id, t.question_text, t.created_at,
                u.full_name AS user_name, u.role AS user_role,
                (SELECT COUNT(*) FROM q_and_a_likes WHERE thread_id = t.id) as like_count,
                EXISTS(SELECT 1 FROM q_and_a_likes WHERE thread_id = t.id AND user_id = $2) as user_has_liked
             FROM q_and_a_threads t
             JOIN users u ON t.user_id = u.id
             WHERE t.lesson_id = $1
             ORDER BY t.created_at ASC`,
            [lessonId, userId]
        );

        const threads = threadsQuery.rows;

        // Với mỗi câu hỏi gốc, lấy tất cả các câu trả lời tương ứng
        for (let thread of threads) {
            const repliesQuery = await pool.query(
                `SELECT 
                    r.id, r.reply_text, r.created_at,
                    u.full_name AS user_name, u.role AS user_role
                 FROM q_and_a_replies r
                 JOIN users u ON r.user_id = u.id
                 WHERE r.thread_id = $1
                 ORDER BY r.created_at ASC`,
                [thread.id]
            );
            thread.replies = repliesQuery.rows;
        }

        res.json(threads);
    } catch (err) {
        console.error("Lỗi khi lấy chuỗi bình luận:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// Tạo một câu hỏi gốc mới (thread) - (Đã cập nhật ở bước trước, gửi thông báo cho GV)
exports.postNewThread = async (req, res) => {
    const client = await pool.connect();
    try {
        const { lessonId } = req.params;
        const { question } = req.body;
        const userId = req.user.id;
        
        if (!question) return res.status(400).json({ msg: 'Vui lòng nhập câu hỏi.' });

        await client.query('BEGIN');

        // 1. Lấy tên học viên
        const userQuery = await client.query("SELECT full_name FROM users WHERE id = $1", [userId]);
        const studentName = userQuery.rows[0].full_name;

        // 2. Thêm câu hỏi vào CSDL
        const newThreadResult = await client.query(
            "INSERT INTO q_and_a_threads (lesson_id, user_id, question_text) VALUES ($1, $2, $3) RETURNING *",
            [lessonId, userId, question]
        );
        const newThread = newThreadResult.rows[0];

        // 3. Tìm giảng viên và thông tin bài học
        const courseInfo = await client.query(
            `SELECT 
                c.instructor_id, 
                l.title AS lesson_title, 
                c.id AS course_id
             FROM lessons l
             JOIN courses c ON l.course_id = c.id
             WHERE l.id = $1`,
            [lessonId]
        );
        
        const { instructor_id, lesson_title, course_id } = courseInfo.rows[0];

        // 4. Gửi thông báo (nếu người hỏi không phải là giảng viên)
        if (instructor_id !== userId) {
            const message = `Học viên "${studentName}" đã đặt câu hỏi mới trong bài học "${lesson_title}"`;
            const link = `/courses/${course_id}/lessons/${lessonId}`;
            const type = 'new_qanda';

            const newNotifResult = await client.query(
                "INSERT INTO notifications (user_id, message, link, type) VALUES ($1, $2, $3, $4) RETURNING *",
                [instructor_id, message, link, type]
            );
            
            const sendNotification = req.app.get('sendNotification');
            if (sendNotification) {
                sendNotification(instructor_id, newNotifResult.rows[0]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json(newThread);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Lỗi khi đăng câu hỏi mới:", err.message);
        res.status(500).send('Lỗi server');
    } finally {
        client.release();
    }
};

// Trả lời/Bình luận trong một chuỗi - (ĐÃ NÂNG CẤP ĐA CHIỀU)
exports.postReply = async (req, res) => {
    const client = await pool.connect();
    try {
        const { threadId } = req.params;
        const { reply } = req.body;
        const userId = req.user.id; // ID người đang trả lời

        if (!reply) return res.status(400).json({ msg: 'Vui lòng nhập nội dung trả lời.' });
        
        await client.query('BEGIN');

        // 1. Lấy tên người đang trả lời
        const userQuery = await client.query("SELECT full_name FROM users WHERE id = $1", [userId]);
        const replierName = userQuery.rows[0].full_name;

        // 2. Thêm câu trả lời
        const newReplyResult = await client.query(
            "INSERT INTO q_and_a_replies (thread_id, user_id, reply_text) VALUES ($1, $2, $3) RETURNING *",
            [threadId, userId, reply]
        );
        const newReply = newReplyResult.rows[0];

        // 3. Tìm giảng viên, người hỏi gốc, và thông tin bài học
        const courseInfo = await client.query(
            `SELECT 
                c.instructor_id,
                t.user_id AS thread_owner_id, -- Lấy ID người hỏi gốc
                l.title AS lesson_title, 
                c.id AS course_id,
                l.id AS lesson_id
             FROM q_and_a_threads t
             JOIN lessons l ON t.lesson_id = l.id
             JOIN courses c ON l.course_id = c.id
             WHERE t.id = $1`,
            [threadId]
        );
        
        const { instructor_id, thread_owner_id, lesson_title, course_id, lesson_id } = courseInfo.rows[0];

        // 4. LOGIC GỬI THÔNG BÁO ĐA CHIỀU
        const sendNotification = req.app.get('sendNotification');
        const link = `/courses/${course_id}/lessons/${lesson_id}`;
        
        if (userId === instructor_id) {
            // === Giảng viên đang trả lời ===
            // Gửi thông báo cho người hỏi gốc (nếu người hỏi gốc không phải là giảng viên)
            if (thread_owner_id !== instructor_id) {
                const message = `Giảng viên "${replierName}" đã trả lời câu hỏi của bạn trong bài học "${lesson_title}"`;
                const type = 'qanda_reply'; // Loại thông báo mới

                const newNotifResult = await client.query(
                    "INSERT INTO notifications (user_id, message, link, type) VALUES ($1, $2, $3, $4) RETURNING *",
                    [thread_owner_id, message, link, type]
                );
                
                if (sendNotification) {
                    sendNotification(thread_owner_id, newNotifResult.rows[0]);
                }
            }
            // (Mở rộng: Gửi cho cả những người khác đã tham gia trả lời, trừ giảng viên)
            // (Điều này sẽ phức tạp hơn, tạm thời chỉ gửi cho người hỏi gốc)

        } else {
            // === Học viên đang trả lời ===
            // Gửi thông báo cho giảng viên (logic từ bước trước)
            const message = `Học viên "${replierName}" đã trả lời trong bài học "${lesson_title}"`;
            const type = 'new_qanda';

            const newNotifResult = await client.query(
                "INSERT INTO notifications (user_id, message, link, type) VALUES ($1, $2, $3, $4) RETURNING *",
                [instructor_id, message, link, type]
            );
            
            if (sendNotification) {
                sendNotification(instructor_id, newNotifResult.rows[0]);
            }
        }
        
        await client.query('COMMIT');
        res.status(201).json(newReply);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Lỗi khi đăng trả lời:", err.message);
        res.status(500).send('Lỗi server');
    } finally {
        client.release();
    }
};

// Like/Unlike một câu hỏi gốc
exports.toggleLikeThread = async (req, res) => {
    try {
        const { threadId } = req.params;
        const userId = req.user.id;

        const existingLike = await pool.query("SELECT * FROM q_and_a_likes WHERE user_id = $1 AND thread_id = $2", [userId, threadId]);

        if (existingLike.rows.length > 0) {
            await pool.query("DELETE FROM q_and_a_likes WHERE user_id = $1 AND thread_id = $2", [userId, threadId]);
            res.json({ liked: false, msg: 'Đã bỏ thích.' });
        } else {
            await pool.query("INSERT INTO q_and_a_likes (user_id, thread_id) VALUES ($1, $2)", [userId, threadId]);
            res.json({ liked: true, msg: 'Đã thích.' });
        }
    } catch (err) {
        console.error("Lỗi khi like:", err.message);
        res.status(500).send('Lỗi server');
    }
};