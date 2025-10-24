// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

// URL: POST http://localhost:5000/api/auth/register
router.post('/register', authController.register);
// Route mới cho đăng nhập
router.post('/login', authController.login); // Thêm dòng này

module.exports = router;