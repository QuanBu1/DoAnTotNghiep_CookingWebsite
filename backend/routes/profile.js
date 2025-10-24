    const express = require('express');
    const router = express.Router();
    const authMiddleware = require('../middleware/authMiddleware');
    const profileController = require('../controllers/profile');

    // GET /api/profile/favorites - Lấy danh sách khóa học yêu thích
    router.get('/favorites', authMiddleware, profileController.getFavoriteCourses);
    // GET /api/profile/enrolled-courses - Lấy danh sách khóa học đã ghi danh
    router.get('/enrolled-courses', authMiddleware, profileController.getEnrolledCourses);

    module.exports = router;
