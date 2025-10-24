// routes/qanda.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
// *** Middleware checkEnrollmentMiddleware không cần thiết ở đây nữa vì nó đã được dùng ở cấp cao hơn ***
const qandaController = require('../controllers/qandaController');

// Lấy tất cả chuỗi bình luận của một bài học
// Middleware checkEnrollment sẽ được áp dụng ở file lessons.js hoặc courses.js khi truy cập bài học
router.get('/:courseId/:lessonId', authMiddleware, qandaController.getThreadsForLesson);

// Tạo một câu hỏi/chuỗi mới
router.post('/:courseId/:lessonId', authMiddleware, qandaController.postNewThread);

// Trả lời/Bình luận trong một chuỗi
router.post('/:courseId/:threadId/reply', authMiddleware, qandaController.postReply);

// Like/Unlike một câu hỏi/chuỗi
router.post('/:courseId/:threadId/like', authMiddleware, qandaController.toggleLikeThread);

module.exports = router;