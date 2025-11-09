// routes/ai.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const aiController = require('../controllers/aiController');

// API này yêu cầu đăng nhập để tránh lạm dụng (vì AI có tốn phí)
router.post('/chat', authMiddleware, aiController.chatWithAI);

module.exports = router;