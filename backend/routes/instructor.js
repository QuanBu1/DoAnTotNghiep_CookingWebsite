// routes/instructor.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const instructorMiddleware = require('../middleware/instructorMiddleware');
const instructorController = require('../controllers/instructorController');

// Middleware sẽ đảm bảo chỉ có user với role 'instructor' mới truy cập được
router.get(
    '/my-courses',
    [authMiddleware, instructorMiddleware],
    instructorController.getMyCourses
);
// === ROUTES MỚI CHO VIỆC CHẤM BÀI ===
router.get(
    '/submissions',
    [authMiddleware, instructorMiddleware],
    instructorController.getSubmissions
);

router.put(
    '/submissions/:submissionId/grade',
    [authMiddleware, instructorMiddleware],
    instructorController.gradeSubmission
);

module.exports = router;