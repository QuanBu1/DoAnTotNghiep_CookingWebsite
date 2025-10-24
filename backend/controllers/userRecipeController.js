// controllers/userRecipeController.js
const pool = require('../db');

// ... (giữ nguyên các hàm: createRecipe, getAllPublicRecipes, getPublicRecipeById, updateRecipe, deleteRecipe, toggleReaction, toggleSaveRecipe) ...

// [POST] Tạo công thức mới
exports.createRecipe = async (req, res) => {
    const { title, description, ingredients, instructions, image_url, serving_size, cooking_time } = req.body;
    const userId = req.user.id;

    if (!title || !ingredients || !instructions) {
        return res.status(400).json({ msg: 'Vui lòng nhập đầy đủ Tiêu đề, Nguyên liệu và Hướng dẫn.' });
    }

    try {
        const newRecipe = await pool.query(
            `INSERT INTO user_recipes (user_id, title, description, ingredients, instructions, image_url, serving_size, cooking_time)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [userId, title, description, ingredients, instructions, image_url, serving_size, cooking_time]
        );
        res.status(201).json(newRecipe.rows[0]);
    } catch (err) {
        console.error("Lỗi khi tạo công thức:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// [GET] Lấy tất cả công thức CÔNG KHAI (cho mọi người xem)
exports.getAllPublicRecipes = async (req, res) => {
    try {
        const recipes = await pool.query(
            `SELECT ur.*, COALESCE(u.full_name, 'Tác giả bị xóa') AS author_name
             FROM user_recipes ur
             LEFT JOIN users u ON ur.user_id = u.id
             WHERE ur.title IS NOT NULL
               AND ur.title != ''
             ORDER BY ur.created_at DESC`
        );
        res.json(recipes.rows);
    } catch (err) {
        console.error("Lỗi khi lấy công thức công khai:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// [GET] Lấy một công thức CÔNG KHAI theo ID
exports.getPublicRecipeById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.id : null;

        const recipeQuery = await pool.query(
            `SELECT
                ur.*,
                COALESCE(u.full_name, 'Tác giả ẩn danh') AS author_name,
                (SELECT json_agg(r) FROM (
                    SELECT reaction_type, COUNT(*) as count
                    FROM recipe_reactions
                    WHERE recipe_id = ur.id
                    GROUP BY reaction_type
                ) r) as reactions,
                (SELECT json_agg(reaction_type)
                 FROM recipe_reactions
                 WHERE recipe_id = ur.id AND user_id = $2) as user_reactions,
                EXISTS(SELECT 1 FROM saved_recipes WHERE recipe_id = ur.id AND user_id = $2) as user_has_saved
             FROM user_recipes ur
             LEFT JOIN users u ON ur.user_id = u.id
             WHERE ur.id = $1`,
            [id, userId]
        );

        if (recipeQuery.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy công thức" });
        }

        res.json(recipeQuery.rows[0]);
    } catch (err) {
        console.error("Lỗi khi lấy chi tiết công thức:", err.message);
        res.status(500).send('Lỗi server');
    }
};


// [GET] Lấy tất cả công thức của người dùng
exports.getRecipes = async (req, res) => {
    const userId = req.user.id;
    try {
        const recipes = await pool.query(
            "SELECT * FROM user_recipes WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        res.json(recipes.rows);
    } catch (err) {
        console.error("Lỗi khi lấy công thức:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// [PUT] Cập nhật công thức
exports.updateRecipe = async (req, res) => {
    const { id } = req.params;
    const { title, description, ingredients, instructions, image_url, serving_size, cooking_time } = req.body;
    const userId = req.user.id;

    if (!title || !ingredients || !instructions) {
        return res.status(400).json({ msg: 'Vui lòng nhập đầy đủ Tiêu đề, Nguyên liệu và Hướng dẫn.' });
    }

    try {
        const updatedRecipe = await pool.query(
            `UPDATE user_recipes SET title = $1, description = $2, ingredients = $3, instructions = $4, image_url = $5, serving_size = $8, cooking_time = $9
             WHERE id = $6 AND user_id = $7 RETURNING *`,
            [title, description, ingredients, instructions, image_url, id, userId, serving_size, cooking_time]
        );

        if (updatedRecipe.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy công thức hoặc bạn không có quyền chỉnh sửa." });
        }
        res.json(updatedRecipe.rows[0]);
    } catch (err) {
        console.error("Lỗi khi cập nhật công thức:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// [DELETE] Xóa công thức
exports.deleteRecipe = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const deleteOp = await pool.query(
            "DELETE FROM user_recipes WHERE id = $1 AND user_id = $2 RETURNING id",
            [id, userId]
        );

        if (deleteOp.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy công thức hoặc bạn không có quyền xóa." });
        }
        res.json({ msg: "Đã xóa công thức thành công." });
    } catch (err) {
        console.error("Lỗi khi xóa công thức:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// Xử lý cảm xúc
exports.toggleReaction = async (req, res) => {
    try {
        const { id: recipeId } = req.params;
        const { reactionType } = req.body;
        const userId = req.user.id;

        const existingReaction = await pool.query(
            "SELECT * FROM recipe_reactions WHERE user_id = $1 AND recipe_id = $2 AND reaction_type = $3",
            [userId, recipeId, reactionType]
        );

        if (existingReaction.rows.length > 0) {
            await pool.query(
                "DELETE FROM recipe_reactions WHERE user_id = $1 AND recipe_id = $2 AND reaction_type = $3",
                [userId, recipeId, reactionType]
            );
            res.json({ message: 'Đã gỡ cảm xúc.' });
        } else {
            await pool.query(
                "INSERT INTO recipe_reactions (user_id, recipe_id, reaction_type) VALUES ($1, $2, $3)",
                [userId, recipeId, reactionType]
            );
            res.json({ message: 'Đã thêm cảm xúc.' });
        }
    } catch (err) {
        console.error("Lỗi khi xử lý cảm xúc:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// Lưu/Bỏ lưu công thức
exports.toggleSaveRecipe = async (req, res) => {
    try {
        const { id: recipeId } = req.params;
        const userId = req.user.id;

        const existingSave = await pool.query(
            "SELECT * FROM saved_recipes WHERE user_id = $1 AND recipe_id = $2",
            [userId, recipeId]
        );

        if (existingSave.rows.length > 0) {
            await pool.query(
                "DELETE FROM saved_recipes WHERE user_id = $1 AND recipe_id = $2",
                [userId, recipeId]
            );
            res.json({ saved: false, message: 'Đã bỏ lưu công thức.' });
        } else {
            await pool.query(
                "INSERT INTO saved_recipes (user_id, recipe_id) VALUES ($1, $2)",
                [userId, recipeId]
            );
            res.json({ saved: true, message: 'Đã lưu công thức thành công.' });
        }
    } catch (err) {
        console.error("Lỗi khi lưu công thức:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// Lấy bình luận
exports.getRecipeComments = async (req, res) => {
    try {
        const { id: recipeId } = req.params;
        const comments = await pool.query(
            `SELECT
                rc.id,
                rc.comment_text,
                rc.created_at,
                u.full_name AS user_name,
                u.role AS user_role
             FROM recipe_comments rc
             JOIN users u ON rc.user_id = u.id
             WHERE rc.recipe_id = $1
             ORDER BY rc.created_at ASC`,
            [recipeId]
        );
        res.json(comments.rows);
    } catch (err) {
        console.error("Lỗi khi lấy bình luận công thức:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// Đăng bình luận
exports.postRecipeComment = async (req, res) => {
    try {
        const { id: recipeId } = req.params;
        const { comment } = req.body;
        const userId = req.user.id;

        if (!comment || comment.trim() === '') {
            return res.status(400).json({ msg: 'Vui lòng nhập nội dung bình luận.' });
        }
        
        const newComment = await pool.query(
            "INSERT INTO recipe_comments (recipe_id, user_id, comment_text) VALUES ($1, $2, $3) RETURNING *",
            [recipeId, userId, comment]
        );
        res.status(201).json(newComment.rows[0]);
    } catch (err) {
        console.error("Lỗi khi đăng bình luận:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// === HÀM LẤY CÔNG THỨC TƯƠNG TỰ (ĐÃ SỬA LỖI LOGIC) ===
exports.getSimilarRecipes = async (req, res) => {
    try {
        const { id: recipeId } = req.params;
        const limit = 4; // Số lượng gợi ý cần lấy

        // 1. Lấy user_id (ID tác giả) của công thức hiện tại
        const currentRecipe = await pool.query(
            "SELECT user_id FROM user_recipes WHERE id = $1",
            [recipeId]
        );

        if (currentRecipe.rows.length === 0) {
            return res.json([]); 
        }

        const authorId = currentRecipe.rows[0].user_id;

        // 2. Ưu tiên tìm các công thức khác từ CÙNG TÁC GIẢ
        let similarRecipes = await pool.query(
            `SELECT ur.id, ur.title, ur.image_url, u.full_name AS author_name
             FROM user_recipes ur
             JOIN users u ON ur.user_id = u.id
             WHERE ur.user_id = $2 AND ur.id != $1 AND ur.title IS NOT NULL AND ur.title != ''
             ORDER BY RANDOM()
             LIMIT $3`,
            [recipeId, authorId, limit]
        );

        let recipes = similarRecipes.rows;
        
        // 3. Nếu không đủ, lấy thêm công thức ngẫu nhiên từ CÁC TÁC GIẢ KHÁC
        if (recipes.length < limit) {
            const needed = limit - recipes.length; // Số lượng cần lấy thêm
            
            // Tạo danh sách ID để loại trừ (bài hiện tại + các bài đã có)
            const excludeIds = [recipeId, ...recipes.map(r => r.id)];
            
            const randomRecipes = await pool.query(
                `SELECT ur.id, ur.title, ur.image_url, u.full_name AS author_name
                 FROM user_recipes ur
                 JOIN users u ON ur.user_id = u.id
                 WHERE ur.id NOT IN (${excludeIds.map((_, i) => `$${i + 1}`).join(',')}) AND ur.title IS NOT NULL AND ur.title != ''
                 ORDER BY RANDOM()
                 LIMIT $${excludeIds.length + 1}`,
                [...excludeIds, needed]
            );

            // Gộp 2 kết quả lại
            recipes = [...recipes, ...randomRecipes.rows];
        }

        res.json(recipes);
    } catch (err) {
        console.error("Lỗi khi lấy công thức tương tự:", err.message);
        res.status(500).send('Lỗi server');
    }
};
// === HÀM MỚI: LẤY DANH SÁCH CÁC CÔNG THỨC ĐÃ LƯU CỦA USER ===
exports.getSavedRecipes = async (req, res) => {
    try {
        const userId = req.user.id;
        const savedRecipes = await pool.query(
            `SELECT 
                ur.id, 
                ur.title, 
                ur.image_url, 
                ur.description,
                u.full_name AS author_name
             FROM saved_recipes sr
             JOIN user_recipes ur ON sr.recipe_id = ur.id
             JOIN users u ON ur.user_id = u.id
             WHERE sr.user_id = $1
             ORDER BY sr.saved_at DESC`,
            [userId]
        );
        res.json(savedRecipes.rows);
    } catch (err) {
        console.error("Lỗi khi lấy công thức đã lưu:", err.message);
        res.status(500).send('Lỗi server');
    }
};