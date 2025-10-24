// routes/userRecipes.js

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userRecipeController = require('../controllers/userRecipeController');
const softAuthMiddleware = require('../middleware/softAuthMiddleware');

// === CÁC ROUTE CÔNG KHAI (KHÔNG CẦN ĐĂNG NHẬP) ===

// Lấy danh sách tất cả công thức công khai
router.get('/public', userRecipeController.getAllPublicRecipes);

// Lấy chi tiết một công thức công khai theo ID (ĐÃ SỬA LỖI)
// Chỉ giữ lại MỘT dòng định nghĩa và đặt middleware vào đúng vị trí
router.get('/public/:id', softAuthMiddleware, userRecipeController.getPublicRecipeById);

// === ROUTE MỚI ĐỂ LẤY CÁC MÓN TƯƠNG TỰ ===
router.get('/public/:id/similar', userRecipeController.getSimilarRecipes);

// === CÁC ROUTE CẦN ĐĂNG NHẬP ===
// Middleware này sẽ áp dụng cho tất cả các route được định nghĩa BÊN DƯỚI nó
router.use(authMiddleware);

// GET /api/user-recipes - Lấy tất cả công thức của người dùng
router.get('/', userRecipeController.getRecipes);

// === ROUTE MỚI ĐỂ LẤY CÔNG THỨC ĐÃ LƯU ===
router.get('/saved', userRecipeController.getSavedRecipes);

// POST /api/user-recipes - Tạo công thức mới
router.post('/', userRecipeController.createRecipe);

// PUT /api/user-recipes/:id - Cập nhật công thức
router.put('/:id', userRecipeController.updateRecipe);

// DELETE /api/user-recipes/:id - Xóa công thức
router.delete('/:id', userRecipeController.deleteRecipe);

// Route để xử lý cảm xúc
router.post('/:id/react', userRecipeController.toggleReaction);

// Route để lưu/bỏ lưu công thức
router.post('/:id/save', userRecipeController.toggleSaveRecipe);

// === CÁC ROUTE MỚI CHO BÌNH LUẬN ===
// Lấy tất cả bình luận (cần đăng nhập để xem)
router.get('/:id/comments', userRecipeController.getRecipeComments);

// Đăng bình luận mới
router.post('/:id/comments', userRecipeController.postRecipeComment);
module.exports = router;