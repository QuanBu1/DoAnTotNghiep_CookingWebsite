// routes/tools.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const toolsController = require('../controllers/toolsController');

// Route công khai để tất cả mọi người xem
router.get('/', toolsController.getAllTools);
router.get('/:id', toolsController.getToolById);
// Các route yêu cầu quyền Admin để thao tác
router.post('/', [authMiddleware, adminMiddleware], toolsController.createTool);
router.put('/:id', [authMiddleware, adminMiddleware], toolsController.updateTool);
router.delete('/:id', [authMiddleware, adminMiddleware], toolsController.deleteTool);


module.exports = router;