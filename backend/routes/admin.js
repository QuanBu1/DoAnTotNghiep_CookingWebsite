const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/admin');

// Sử dụng middleware cho tất cả các route trong file này
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/users - Lấy danh sách tất cả người dùng
router.get('/users', adminController.getAllUsers);

// GET /api/admin/users/:userId - Lấy một người dùng
router.get('/users/:userId', adminController.getUserById);

// POST /api/admin/users - Tạo người dùng mới
router.post('/users', adminController.createUser);

// PUT /api/admin/users/:userId - Cập nhật người dùng
router.put('/users/:userId', adminController.updateUser);

// DELETE /api/admin/users/:userId - Xóa một người dùng
router.delete('/users/:userId', adminController.deleteUser);
// Lấy danh sách giảng viên
router.get('/instructors', adminController.getAllInstructors);

// Admin tạo khóa học
router.post('/courses', adminController.createCourse);

// Admin cập nhật khóa học
router.put('/courses/:courseId', adminController.updateCourse);

// Admin xóa khóa học
router.delete('/courses/:courseId', adminController.deleteCourse);
// Lấy tất cả bình luận
router.get('/comments', adminController.getAllComments);

// Xóa một bình luận theo loại (thread/reply) và ID
router.delete('/comments/:type/:id', adminController.deleteComment);

router.get('/instructors-management', adminController.getInstructors);
router.post('/instructors-management', adminController.createInstructor);
router.put('/instructors-management/:instructorId', adminController.updateInstructor);
router.delete('/instructors-management/:instructorId', adminController.deleteInstructor);
router.get('/revenue-stats', adminController.getRevenueStats);
// Lấy tất cả đơn hàng
// Lấy tất cả đơn hàng dụng cụ
router.get('/orders', adminController.getAllOrders);

// Lấy chi tiết một đơn hàng dụng cụ
router.get('/orders/:id', adminController.getOrderDetails);

// Cập nhật trạng thái một đơn hàng dụng cụ
router.put('/orders/:id', adminController.updateOrderStatus);

// === ROUTE MỚI CHO DOANH THU DỤNG CỤ ===
router.get('/tool-revenue', adminController.getToolRevenueStats);

// === ROUTE MỚI CHO QUẢN LÝ TIN NHẮN ===
router.get('/messages', adminController.getAllMessages);
// === ROUTE MỚI CHO QUẢN LÝ TIN NHẮN ===
router.get('/messages', adminController.getAllMessages);
router.get('/messages/:id', adminController.getSingleMessage); // <-- LẤY 1 TIN NHẮN
router.post('/messages/:id/reply', adminController.replyToMessage); // <-- GỬI PHẢN HỒI
module.exports = router;