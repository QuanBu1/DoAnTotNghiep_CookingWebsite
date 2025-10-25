const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/admin');

// Sử dụng middleware cho tất cả các route trong file này
router.use(authMiddleware, adminMiddleware);

// --- User Management ---
router.get('/users', adminController.getAllUsers); // <-- API đã cập nhật
router.get('/users/:userId', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);
// --- Instructor Management ---
// Giữ route này để lấy danh sách giảng viên cho bộ lọc courses
router.get('/instructors', adminController.getAllInstructors);
// Các route quản lý giảng viên riêng (tên route giữ nguyên, controller đã cập nhật)
router.get('/instructors-management', adminController.getInstructors); // <-- API đã cập nhật
router.post('/instructors-management', adminController.createInstructor);
router.put('/instructors-management/:instructorId', adminController.updateInstructor);
router.delete('/instructors-management/:instructorId', adminController.deleteInstructor);

// --- Course Management ---
router.get('/courses', adminController.getAllCourses); // <-- API đã cập nhật
router.post('/courses', adminController.createCourse);
router.put('/courses/:courseId', adminController.updateCourse);
router.delete('/courses/:courseId', adminController.deleteCourse);

// --- Kitchen Tool Management ---
router.get('/tools', adminController.getAllTools); // <-- API đã cập nhật
// Các route POST, PUT, DELETE cho tools nằm ở /api/tools nhưng cần adminMiddleware
// Chúng ta sẽ giữ các route đó ở file routes/tools.js và đảm bảo middleware được áp dụng đúng
// Tuy nhiên, hàm getToolById cũng cần thiết ở đây để xem chi tiết
router.get('/tools/:id', adminController.getToolById); // Giữ hàm này

// --- Order Management ---
router.get('/orders', adminController.getAllOrders); // <-- API đã cập nhật
router.get('/orders/:id', adminController.getOrderDetails);
router.put('/orders/:id', adminController.updateOrderStatus);

// --- Comment Management ---
router.get('/comments', adminController.getAllComments); // <-- API đã cập nhật
router.delete('/comments/:type/:id', adminController.deleteComment);

// --- Message Management ---
router.get('/messages', adminController.getAllMessages); // <-- API đã cập nhật
router.get('/messages/:id', adminController.getSingleMessage);
router.post('/messages/:id/reply', adminController.replyToMessage);

// --- Statistics ---
router.get('/revenue-stats', adminController.getRevenueStats);
router.get('/tool-revenue', adminController.getToolRevenueStats);

module.exports = router;