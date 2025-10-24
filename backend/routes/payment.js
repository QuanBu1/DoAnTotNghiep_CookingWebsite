// routes/payment.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

// [GET] /api/payment/checkout/:enrollmentId - Lấy thông tin đơn hàng để thanh toán
router.get('/checkout/:enrollmentId', authMiddleware, paymentController.getCheckoutDetails);

// [GET] /api/payment/status/:enrollmentId - Kiểm tra trạng thái thanh toán
router.get('/status/:enrollmentId', authMiddleware, paymentController.getPaymentStatus);

// [POST] /api/payment/cancel/:enrollmentId - Hủy đơn hàng (khi hết giờ)
router.post('/cancel/:enrollmentId', authMiddleware, paymentController.cancelOrder);

// [POST] /api/payment/webhook/sepay - Webhook nhận kết quả từ SePay (không cần auth)
router.post('/webhook/sepay', paymentController.handleSepayWebhook);

module.exports = router;