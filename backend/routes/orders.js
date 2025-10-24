// routes/orders.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const toolOrderController = require('../controllers/toolOrderController');

// Tất cả các route này yêu cầu đăng nhập (authMiddleware)

// [POST] Tạo đơn hàng Dụng cụ
router.post('/tools', authMiddleware, toolOrderController.createToolOrder);

// [GET] Lấy lịch sử đơn hàng Dụng cụ
router.get('/tools/history', authMiddleware, toolOrderController.getOrderHistory);

// [GET] ROUTE MỚI: Lấy trạng thái đơn hàng (để polling)
router.get('/tools/:orderId/status', authMiddleware, toolOrderController.getOrderStatus);

// [GET] Lấy chi tiết đơn hàng Dụng cụ
router.get('/tools/:orderId', authMiddleware, toolOrderController.getOrderDetails);

// [PUT] Cập nhật phương thức thanh toán/Xác nhận đơn hàng
router.put('/tools/:orderId/confirm', authMiddleware, toolOrderController.confirmOrderPayment);

// [POST] Hủy đơn hàng Dụng cụ
router.post('/tools/:orderId/cancel', authMiddleware, toolOrderController.cancelToolOrder);

module.exports = router;