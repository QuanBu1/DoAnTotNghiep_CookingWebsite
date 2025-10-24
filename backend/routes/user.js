// routes/user.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/user');

// GET /api/user/me - Lấy thông tin người dùng
router.get('/me', authMiddleware, userController.getMe);

// PUT /api/user/me - Cập nhật thông tin người dùng
router.put('/me', authMiddleware, userController.updateMe);

// GET /api/user/:userId/public
router.get('/:userId/public', userController.getPublicProfile);

module.exports = router;