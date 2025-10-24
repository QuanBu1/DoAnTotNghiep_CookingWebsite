// routes/notifications.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.get('/', authMiddleware, notificationController.getNotifications);
router.put('/read-all', authMiddleware, notificationController.markAsRead);

module.exports = router;