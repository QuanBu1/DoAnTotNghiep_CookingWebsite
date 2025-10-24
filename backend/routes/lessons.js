const express = require('express');
const router = express.Router();

// Import tất cả middleware và controller cần thiết
const authMiddleware = require('../middleware/authMiddleware');
const checkEnrollmentMiddleware = require('../middleware/checkEnrollmentMiddleware');
const checkCourseOwner = require('../middleware/checkCourseOwner');
const lessonController = require('../controllers/lessons');

// GET /api/lessons/:courseId/:lessonId - Lấy chi tiết một bài học
router.get(
    '/:courseId/:lessonId',
    [authMiddleware, checkEnrollmentMiddleware],
    lessonController.getLessonById
);

// PUT /api/lessons/:courseId/:lessonId - Cập nhật một bài học
router.put(
    '/:courseId/:lessonId',
    [authMiddleware, checkCourseOwner],
    lessonController.updateLesson
);

// DELETE /api/lessons/:courseId/:lessonId - Xóa một bài học
router.delete(
    '/:courseId/:lessonId',
    [authMiddleware, checkCourseOwner],
    lessonController.deleteLesson
);

// === ROUTE BỊ THIẾU LÀ ĐÂY ===
// POST /api/lessons/:courseId/:lessonId/complete - Đánh dấu bài học là đã hoàn thành
router.post(
    '/:courseId/:lessonId/complete',
    [authMiddleware, checkEnrollmentMiddleware],
    lessonController.markAsComplete
);

// === ROUTE MỚI CHO NỘP BÀI THỰC HÀNH ===
router.post(
    '/:courseId/:lessonId/submit',
    [authMiddleware, checkEnrollmentMiddleware], // Chỉ ai đã ghi danh mới được nộp
    lessonController.submitPractice
);

// === ROUTE MỚI ĐỂ HỌC VIÊN XEM BÀI NỘP ===
router.get(
    '/:courseId/:lessonId/submission',
    [authMiddleware, checkEnrollmentMiddleware],
    lessonController.getSubmissionForStudent
);
module.exports = router;

