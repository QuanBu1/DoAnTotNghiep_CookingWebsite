// routes/courses.js

const express = require('express');
const router = express.Router();

// Import tất cả middleware và controller
const authMiddleware = require('../middleware/authMiddleware');
const instructorMiddleware = require('../middleware/instructorMiddleware');
const checkCourseOwner = require('../middleware/checkCourseOwner');
const softAuthMiddleware = require('../middleware/softAuthMiddleware');
const courseController = require('../controllers/courses');

// === THỨ TỰ ROUTES ĐÃ ĐƯỢC SỬA LẠI ===

// 1. Route cụ thể phải được đặt lên trước
router.get('/search', courseController.searchCourses);

// --- Routes cho Khóa học ---
router.post('/', [authMiddleware, instructorMiddleware], courseController.createCourse);
router.get('/', courseController.getAllCourses);

// 2. Route chung (có tham số) được đặt sau
router.get('/:id', courseController.getCourseById); 

router.put('/:courseId', [authMiddleware, checkCourseOwner], courseController.updateCourse);
router.delete('/:courseId', [authMiddleware, checkCourseOwner], courseController.deleteCourse);

// --- Routes cho Bài học ---
router.get('/:courseId/lessons', softAuthMiddleware, courseController.getLessonsForCourse);
router.post('/:courseId/lessons', [authMiddleware, checkCourseOwner], courseController.addLessonToCourse);

// --- Routes cho Ghi danh (Enrollment) ---
router.post('/:courseId/enroll', authMiddleware, courseController.enrollInCourse);
router.get('/:courseId/enrollment-status', authMiddleware, courseController.getEnrollmentStatus);

// === Routes cho Yêu thích ===
router.post('/:courseId/favorite', authMiddleware, courseController.toggleFavorite);
router.get('/:courseId/favorite-status', authMiddleware, courseController.getFavoriteStatus);
    
module.exports = router;