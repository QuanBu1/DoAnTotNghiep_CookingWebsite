// controllers/toolsController.js
const pool = require('../db');

// [GET] Lấy tất cả dụng cụ (cho tất cả mọi người)
exports.getAllTools = async (req, res) => {
    try {
        // Đã thêm features, long_description vào câu lệnh SELECT
        const tools = await pool.query("SELECT id, name, description, image_url, purchase_link, price, features, long_description FROM kitchen_tools ORDER BY id DESC");
        res.json(tools.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

// [POST] Tạo dụng cụ mới (chỉ Admin)
exports.createTool = async (req, res) => {
    const { name, description, image_url, purchase_link, price, features, long_description } = req.body; // THÊM features, long_description
    if (!name) {
        return res.status(400).json({ msg: 'Tên sản phẩm là bắt buộc.' });
    }
    try {
        const newTool = await pool.query(
            "INSERT INTO kitchen_tools (name, description, image_url, purchase_link, price, features, long_description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [name, description, image_url, purchase_link, price, features, long_description]
        );
        res.status(201).json(newTool.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

// [GET] Lấy chi tiết một dụng cụ theo ID (HÀM MỚI)
exports.getToolById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // FIX: Kiểm tra và ép kiểu ID
        const toolIdInt = parseInt(id, 10);
        if (isNaN(toolIdInt) || toolIdInt <= 0) {
            return res.status(400).json({ msg: "ID dụng cụ không hợp lệ." });
        }
        
        const tool = await pool.query(
            "SELECT id, name, description, image_url, purchase_link, price, features, long_description FROM kitchen_tools WHERE id = $1", 
            [toolIdInt]
        );
        if (tool.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy dụng cụ" });
        }
        res.json(tool.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};


// [PUT] Cập nhật dụng cụ (chỉ Admin)
exports.updateTool = async (req, res) => {
    const { id } = req.params;
    const { name, description, image_url, purchase_link, price, features, long_description } = req.body; // THÊM features, long_description
    
    // FIX: Kiểm tra và ép kiểu ID
    const toolIdInt = parseInt(id, 10);
    if (isNaN(toolIdInt) || toolIdInt <= 0) {
        return res.status(400).json({ msg: "ID dụng cụ không hợp lệ." });
    }

    try {
        // Cập nhật câu lệnh UPDATE để bao gồm các trường mới.
        const updatedTool = await pool.query(
            "UPDATE kitchen_tools SET name = $1, description = $2, image_url = $3, purchase_link = $4, price = $5, features = $6, long_description = $7 WHERE id = $8 RETURNING *",
            [name, description, image_url, purchase_link, price, features, long_description, toolIdInt]
        );
        if (updatedTool.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy dụng cụ." });
        }
        res.json(updatedTool.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

// [DELETE] Xóa dụng cụ (chỉ Admin)
exports.deleteTool = async (req, res) => {
    const { id } = req.params;
    
    // FIX: Kiểm tra và ép kiểu ID
    const toolIdInt = parseInt(id, 10);
    if (isNaN(toolIdInt) || toolIdInt <= 0) {
        return res.status(400).json({ msg: "ID dụng cụ không hợp lệ." });
    }

    try {
        const deleteOp = await pool.query("DELETE FROM kitchen_tools WHERE id = $1", [toolIdInt]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ msg: "Không tìm thấy dụng cụ." });
        }
        res.json({ msg: "Đã xóa dụng cụ thành công." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};