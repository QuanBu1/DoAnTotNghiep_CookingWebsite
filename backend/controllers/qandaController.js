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

// Tạo một câu hỏi gốc mới (thread)
exports.postNewThread = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { question } = req.body;
        const userId = req.user.id;
        
        if (!question) return res.status(400).json({ msg: 'Vui lòng nhập câu hỏi.' });

        const newThread = await pool.query(
            "INSERT INTO q_and_a_threads (lesson_id, user_id, question_text) VALUES ($1, $2, $3) RETURNING *",
            [lessonId, userId, question]
        );
        res.status(201).json(newThread.rows[0]);
    } catch (err) {
        console.error("Lỗi khi đăng câu hỏi mới:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// Trả lời/Bình luận trong một chuỗi
exports.postReply = async (req, res) => {
    try {
        const { threadId } = req.params;
        const { reply } = req.body;
        const userId = req.user.id;

        if (!reply) return res.status(400).json({ msg: 'Vui lòng nhập nội dung trả lời.' });
        
        const newReply = await pool.query(
            "INSERT INTO q_and_a_replies (thread_id, user_id, reply_text) VALUES ($1, $2, $3) RETURNING *",
            [threadId, userId, reply]
        );
        res.status(201).json(newReply.rows[0]);
    } catch (err) {
        console.error("Lỗi khi đăng trả lời:", err.message);
        res.status(500).send('Lỗi server');
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