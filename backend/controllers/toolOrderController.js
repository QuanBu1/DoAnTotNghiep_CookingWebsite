// controllers/toolOrderController.js
const pool = require('../db');

// Helper: Tạo mã giao dịch duy nhất
const generateTransactionCode = (orderId) => {
    return `TOOL${orderId}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
};

// [POST] Tạo đơn hàng mới (ĐÃ CẬP NHẬT để nhận nhiều sản phẩm)
exports.createToolOrder = async (req, res) => {
    const { items, shipping_address } = req.body; 
    const userId = req.user.id;
    
    if (!items || items.length === 0 || !shipping_address) {
        return res.status(400).json({ msg: 'Vui lòng cung cấp danh sách sản phẩm và địa chỉ giao hàng.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        let totalAmount = 0;
        const processedItems = [];

        // 1. Tính toán tổng tiền và xác thực giá
        for (const item of items) {
             const quantityInt = parseInt(item.quantity);
             const toolIdInt = parseInt(item.id);

             if (isNaN(toolIdInt) || quantityInt <= 0) {
                 await client.query('ROLLBACK');
                 return res.status(400).json({ msg: 'Danh sách sản phẩm không hợp lệ: ID hoặc số lượng không đúng.' });
             }
             
             const toolRes = await client.query("SELECT price, name FROM kitchen_tools WHERE id = $1", [toolIdInt]);
             if (toolRes.rows.length === 0) {
                 await client.query('ROLLBACK');
                 return res.status(404).json({ msg: `Không tìm thấy dụng cụ với ID: ${toolIdInt}.` });
             }
             const toolPrice = parseFloat(toolRes.rows[0].price);
             
             processedItems.push({
                 id: toolIdInt,
                 name: toolRes.rows[0].name,
                 price: toolPrice,
                 quantity: quantityInt,
                 subtotal: toolPrice * quantityInt
             });

             totalAmount += toolPrice * quantityInt;
        }

        // 2. Tạo đơn hàng MASTER (Dùng các cột cũ để lưu thông tin tóm tắt)
        const firstItem = processedItems[0];
        
        const newOrderRes = await client.query(
            `INSERT INTO tool_orders (user_id, tool_id, quantity, tool_price, total_amount, shipping_address, transaction_code) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [
                userId, 
                firstItem.id, // ID item đầu tiên (để tránh lỗi CSDL)
                firstItem.quantity, // Số lượng item đầu tiên
                firstItem.price, // Giá item đầu tiên
                totalAmount, // TỔNG TIỀN CỦA CẢ GIỎ HÀNG (QUAN TRỌNG)
                shipping_address,
                JSON.stringify(processedItems) // LƯU CHI TIẾT GIỎ HÀNG (JSON)
            ]
        );
        const orderId = newOrderRes.rows[0].id;

        await client.query('COMMIT');
        res.status(201).json({ msg: "Đơn hàng đã được tạo.", orderId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Lỗi khi tạo đơn hàng dụng cụ:", err.message);
        res.status(500).send('Lỗi server');
    } finally {
        client.release();
    }
};

// [GET] Lấy chi tiết đơn hàng (ĐÃ SỬA để đọc JSON và trả về danh sách items an toàn)
exports.getOrderDetails = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    try {
        if (!orderId || isNaN(parseInt(orderId))) {
             return res.status(400).json({ msg: "ID đơn hàng không hợp lệ." });
        }
        
        const orderRes = await pool.query(
            `SELECT 
                o.id, o.quantity, o.total_amount, o.shipping_address, o.status, o.payment_method, o.created_at, o.transaction_code,
                o.tool_price, o.tool_id
             FROM tool_orders o
             WHERE o.id = $1 AND o.user_id = $2`,
            [orderId, userId]
        );

        if (orderRes.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập." });
        }
        
        let order = orderRes.rows[0];

        // 1. Phân tích JSON từ transaction_code với kiểm tra an toàn
        try {
            // KIỂM TRA NẾU DỮ LIỆU BẮT ĐẦU BẰNG '[' (JSON Array)
            if (order.transaction_code && order.transaction_code.startsWith('[')) {
                 order.items = JSON.parse(order.transaction_code); 
            } else {
                // ĐƠN HÀNG CŨ: Dùng các cột cũ (tool_id, quantity, price) để tạo lại item giả lập
                order.items = [{
                    id: order.tool_id,
                    name: "Sản phẩm đơn lẻ", 
                    price: order.tool_price,
                    quantity: order.quantity,
                    subtotal: order.total_amount
                }];
            }

            if(order.items.length > 0) {
                 // Tính toán lại tool_name và quantity tóm tắt cho giao diện
                 order.tool_name = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');
                 order.quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
                 // Lấy giá của item đầu tiên
                 order.tool_price = order.items[0].price;
            } else {
                 order.tool_name = `Đơn hàng trống (ĐH #${order.id})`;
            }

        } catch (e) {
             console.error("Lỗi khi parse items_json:", e);
             order.items = [{name: "Lỗi tải chi tiết sản phẩm", quantity: 1, price: order.total_amount, subtotal: order.total_amount}];
             order.tool_name = "Đơn hàng lỗi";
        }
        
        // 2. Tạo mã giao dịch mới nếu cần (temp_transaction_code)
        if (order.payment_method === 'bank_transfer' && order.items[0] && !order.items[0].temp_transaction_code) {
             const transactionCode = generateTransactionCode(order.id);
             order.temp_transaction_code = transactionCode; 
        } else if (order.items[0]?.temp_transaction_code) {
             order.temp_transaction_code = order.items[0].temp_transaction_code;
        }

        res.json(order);
    } catch (err) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// [PUT] Cập nhật phương thức thanh toán và trạng thái
exports.confirmOrderPayment = async (req, res) => {
    const { orderId } = req.params;
    const { payment_method, shipping_address } = req.body; 
    const userId = req.user.id;

    if (!orderId || isNaN(parseInt(orderId))) {
         return res.status(400).json({ msg: "ID đơn hàng không hợp lệ." });
    }
    
    try {
        const newStatus = payment_method === 'cod' ? 'confirmed' : 'pending';
        let transactionCode = null;

        const oldOrderRes = await pool.query("SELECT transaction_code FROM tool_orders WHERE id = $1", [orderId]);
        const oldItemsJson = oldOrderRes.rows[0].transaction_code;
        
        let items;
        // Kiểm tra an toàn trước khi parse để đảm bảo nó là JSON (cho đơn hàng mới)
        if (oldItemsJson && oldItemsJson.startsWith('[')) {
             items = JSON.parse(oldItemsJson);
        } else {
             // Đây là đơn hàng cũ, không cần parse, chỉ cần cập nhật
             items = null;
        }
        

        if (payment_method === 'bank_transfer' && items) {
             transactionCode = generateTransactionCode(orderId);
             items[0].temp_transaction_code = transactionCode; // Lưu tạm mã giao dịch vào JSON
             
             // Update transaction_code field in DB with new JSON
             await pool.query(
                `UPDATE tool_orders 
                 SET payment_method = $1, status = $2, transaction_code = $3, shipping_address = $5
                 WHERE id = $4 AND user_id = $6`,
                [payment_method, newStatus, JSON.stringify(items), orderId, shipping_address, userId]
             );
        } else {
            // Trường hợp: COD (không cần mã giao dịch) HOẶC Đơn hàng cũ (không có JSON items)
            await pool.query(
                `UPDATE tool_orders 
                 SET payment_method = $1, status = $2, shipping_address = $4
                 WHERE id = $3 AND user_id = $5`,
                [payment_method, newStatus, orderId, shipping_address, userId]
            );
        }

        res.json({ 
            msg: `Đơn hàng đã được xác nhận.`, 
            status: newStatus,
            transactionCode: transactionCode
        });

    } catch (err) {
        console.error("Lỗi khi xác nhận đơn hàng:", err.message);
        res.status(500).send('Lỗi server');
    }
};
// [POST] Hủy đơn hàng dụng cụ (Nếu hết thời gian chờ hoặc người dùng tự hủy)
exports.cancelToolOrder = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    
    try {
        if (!orderId || isNaN(parseInt(orderId))) {
             return res.status(400).json({ msg: "ID đơn hàng không hợp lệ." });
        }
        
        // Chỉ hủy nếu trạng thái là 'pending' (Chờ chuyển khoản)
        const result = await pool.query(
            "UPDATE tool_orders SET status = 'cancelled' WHERE id = $1 AND user_id = $2 AND status = 'pending' RETURNING id",
            [orderId, userId]
        );
        
        if (result.rows.length > 0) {
            res.json({ msg: 'Đơn hàng dụng cụ đã được hủy.' });
        } else {
            // Trường hợp: đã confirmed (COD) hoặc đã bank_transfer/completed
            res.status(400).json({ msg: 'Không thể hủy đơn hàng này. Đơn hàng đã được xác nhận hoặc hết hạn.' });
        }

    } catch (err) {
        console.error("Lỗi khi hủy đơn hàng dụng cụ:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// [GET] Lấy lịch sử đơn hàng (ĐÃ SỬA để đọc JSON an toàn và tạo tóm tắt tên sản phẩm)
exports.getOrderHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        const historyRes = await pool.query(
            `SELECT 
                o.id, o.total_amount, o.status, o.payment_method, o.created_at, o.transaction_code, o.tool_id, o.quantity
             FROM tool_orders o
             WHERE o.user_id = $1
             ORDER BY o.created_at DESC`,
            [userId]
        );
        
        const historyRows = historyRes.rows.map(row => {
            let tool_name_summary = `Đơn hàng tổng hợp #${row.id}`;
            let tool_name_from_db = '';

            try {
                // Thử parse JSON (cho đơn hàng mới)
                 if (row.transaction_code && row.transaction_code.startsWith('[')) {
                    const items = JSON.parse(row.transaction_code);
                    tool_name_summary = items.map(i => `${i.name} x${i.quantity}`).join(', ');
                 } else {
                    // Nếu là đơn hàng cũ (non-JSON), chỉ hiển thị thông tin tóm tắt cũ
                    tool_name_summary = `Sản phẩm đơn lẻ (ĐH #${row.id})`;
                 }
            } catch (e) { 
                 tool_name_summary = `Đơn hàng lỗi (ID: ${row.id})`;
            }

            return {
                ...row,
                tool_name: tool_name_summary // Dùng cột mới để lưu tóm tắt tên sản phẩm
            }
        });

        res.json(historyRows);
    } catch (err) {
        console.error("Lỗi khi lấy lịch sử đơn hàng:", err.message);
        res.status(500).send('Lỗi server');
    }
};
// HÀM MỚI: Chỉ lấy trạng thái của đơn hàng để polling
exports.getOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    try {
        const statusQuery = await pool.query(
            "SELECT status FROM tool_orders WHERE id = $1 AND user_id = $2",
            [orderId, userId]
        );

        if (statusQuery.rows.length === 0) {
            return res.status(404).json({ status: 'not_found' });
        }

        res.json({ status: statusQuery.rows[0].status });
    } catch (err) {
        console.error("Lỗi tại getOrderStatus:", err.message);
        res.status(500).send('Lỗi server');
    }
};