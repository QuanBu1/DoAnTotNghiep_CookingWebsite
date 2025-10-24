// controllers/paymentController.js
const pool = require('../db');

// Lấy thông tin chi tiết của một đơn hàng để hiển thị trên trang checkout
exports.getCheckoutDetails = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const userId = req.user.id;

        const orderQuery = await pool.query(
            `SELECT e.id, e.status, e.created_at,
                    c.id AS course_id, 
                    c.title AS course_title, c.price,
                    u.full_name AS user_name
             FROM enrollments e
             JOIN courses c ON e.course_id = c.id
             JOIN users u ON e.user_id = u.id
             WHERE e.id = $1 AND e.user_id = $2`,
            [enrollmentId, userId]
        );

        if (orderQuery.rows.length === 0) {
            return res.status(404).json({ msg: 'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập.' });
        }

        res.json(orderQuery.rows[0]);
    } catch (err) {
        console.error("Lỗi tại getCheckoutDetails:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// Kiểm tra trạng thái thanh toán của đơn hàng
exports.getPaymentStatus = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const userId = req.user.id;

        const statusQuery = await pool.query(
            "SELECT status FROM enrollments WHERE id = $1 AND user_id = $2",
            [enrollmentId, userId]
        );

        if (statusQuery.rows.length === 0) {
            return res.status(404).json({ status: 'not_found' });
        }

        res.json({ status: statusQuery.rows[0].status });
    } catch (err) {
        console.error("Lỗi tại getPaymentStatus:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// Xử lý Webhook từ SePay (Đã sửa lỗi Type Mismatch 22P02 và tra cứu trạng thái)
exports.handleSepayWebhook = async (req, res) => {
    console.log("=============== WEBHOOK TỪ SEPAY ĐÃ ĐẾN! ===============");
    console.log("Thời gian:", new Date().toLocaleString());
    console.log("Nội dung nhận được (req.body):", JSON.stringify(req.body, null, 2));
    
    const { content, transferAmount, transferType } = req.body;

    if (!content || transferType !== 'in') {
        console.log("Webhook bị từ chối: Sai loại giao dịch hoặc thiếu nội dung.");
        return res.status(400).send('Dữ liệu không hợp lệ');
    }

    // 1. CỐ GẮNG TÌM ID VÀ LOẠI ĐƠN HÀNG (Sử dụng regex chỉ bắt ID số)
    const courseMatch = content.match(/DKKH(\d+)/i);
    const toolMatch = content.match(/TOOL(\d+)/i); 

    let targetId = null;
    let targetTable = null;

    if (courseMatch) {
        targetId = parseInt(courseMatch[1], 10);
        targetTable = 'enrollments';
    } else if (toolMatch) { 
        targetId = parseInt(toolMatch[1], 10); 
        targetTable = 'tool_orders';
    }
    
    if (!targetId) {
        console.log("Webhook bị từ chối: Không tìm thấy ID đơn hàng (DKKH/TOOL ID) trong nội dung:", content);
        return res.status(400).send('Nội dung giao dịch không chứa mã đơn hàng hợp lệ');
    }
    
    console.log(`Đã trích xuất ID: ${targetId} cho loại: ${targetTable}`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 2. TÌM KIẾM ĐƠN HÀNG TƯƠNG ỨNG VÀ LẤY GIÁ TRỊ GỐC (Lấy mọi trạng thái để kiểm tra)
        let expectedStatusQuery = null; 
        
        if (targetTable === 'enrollments') {
            expectedStatusQuery = await client.query(
                `SELECT e.id, c.price AS expected_price, e.status
                 FROM enrollments e
                 JOIN courses c ON e.course_id = c.id
                 WHERE e.id = $1`,
                [targetId]
            );
        } else if (targetTable === 'tool_orders') {
             expectedStatusQuery = await client.query(
                `SELECT id, total_amount AS expected_price, status
                 FROM tool_orders
                 WHERE id = $1`, 
                [targetId] 
            );
        }

        // --- BƯỚC 2A: KIỂM TRA TỔNG QUAN VÀ XỬ LÝ TRẠNG THÁI ĐÃ XÁC NHẬN ---
        if (expectedStatusQuery.rows.length === 0) {
            await client.query('ROLLBACK');
            console.log(`Webhook LỖI: Không tìm thấy đơn hàng ${targetTable} với ID: ${targetId}.`);
            return res.status(404).send('Không tìm thấy đơn hàng');
        }

        const currentStatus = expectedStatusQuery.rows[0].status;
        
        // NẾU ĐƠN HÀNG ĐÃ Ở TRẠNG THÁI THÀNH CÔNG -> TRẢ VỀ 200 OK ĐỂ TRÁNH LẶP LẠI GIAO DỊCH
        if (currentStatus === 'da xac nhan' || currentStatus === 'confirmed' || currentStatus === 'completed' || currentStatus === 'shipped') {
            await client.query('ROLLBACK');
            console.log(`Webhook BỎ QUA: Đơn hàng ${targetTable} ${targetId} đã được xác nhận (Trạng thái: ${currentStatus}).`);
            return res.status(200).json({ success: true, msg: "Đơn hàng đã được xử lý thành công trước đó." });
        }
        
        // --- BƯỚC 2B: LỌC CHỈ CÁC ĐƠN HÀNG ĐANG CHỜ THANH TOÁN ---
        let orderQuery = null;
        if (targetTable === 'enrollments') {
            // Khóa học: phải có status = 'cho xac nhan'
            orderQuery = expectedStatusQuery.rows.filter(r => r.status === 'cho xac nhan');
        } else if (targetTable === 'tool_orders') {
            // Dụng cụ: chấp nhận status = 'pending' HOẶC 'pending_selection'
            orderQuery = expectedStatusQuery.rows.filter(r => r.status === 'pending' || r.status === 'pending_selection');
        }

        if (orderQuery.length === 0) {
            await client.query('ROLLBACK');
            console.log(`Webhook LỖI: Không tìm thấy đơn hàng ${targetTable} đang chờ xử lý với ID: ${targetId}.`);
            console.log("Nguyên nhân có thể: Đơn hàng đã bị hủy, hết hạn, hoặc ID không tồn tại.");
            return res.status(404).send('Không tìm thấy đơn hàng đang chờ xử lý');
        }
        
        const expectedPrice = orderQuery[0].expected_price; // Lấy từ kết quả đã lọc
        
        // 3. SO SÁNH SỐ TIỀN
        if (parseInt(transferAmount, 10) !== parseInt(expectedPrice, 10)) {
            await client.query('ROLLBACK');
            console.log(`Webhook LỖI: Số tiền không khớp. Mong đợi: ${expectedPrice}, Nhận được: ${transferAmount}`);
            return res.status(400).send('Số tiền không khớp');
        }

        // 4. CẬP NHẬT TRẠNG THÁI
        if (targetTable === 'enrollments') {
            await client.query(
                "UPDATE enrollments SET status = 'da xac nhan' WHERE id = $1",
                [targetId]
            );
            await client.query(
                `INSERT INTO payment_history (enrollment_id, amount, payment_method, status, transaction_content)
                 VALUES ($1, $2, 'Chuyển khoản SePay', 'Đã hoàn thành', $3)`,
                [targetId, transferAmount, content]
            );
        } else if (targetTable === 'tool_orders') {
            await client.query(
                "UPDATE tool_orders SET status = 'confirmed', payment_method = 'bank_transfer' WHERE id = $1",
                [targetId]
            );
        }
        
        console.log(`THÀNH CÔNG: Đã cập nhật trạng thái đơn hàng ${targetTable} ${targetId}.`);

        await client.query('COMMIT');
        console.log("=============== KẾT THÚC XỬ LÝ WEBHOOK ===============");
        res.status(200).json({ success: true });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('*** WEBHOOK GẶP LỖI NGHIÊM TRỌNG KHI TƯƠNG TÁC CSDL ***');
        console.error('Lỗi chi tiết:', err); 
        res.status(500).send('Lỗi xử lý giao dịch phía server');
    } finally {
        client.release();
    }
};
// Hủy đơn hàng nếu hết hạn
exports.cancelOrder = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const userId = req.user.id;
        
        const result = await pool.query(
            "UPDATE enrollments SET status = 'da huy' WHERE id = $1 AND user_id = $2 AND status = 'cho xac nhan'",
            [enrollmentId, userId]
        );
        
        if (result.rowCount > 0) {
            res.json({ msg: 'Đơn hàng đã được hủy.' });
        } else {
            res.status(400).json({ msg: 'Không thể hủy đơn hàng này.' });
        }

    } catch (err) {
        console.error("Lỗi tại cancelOrder:", err.message);
        res.status(500).send('Lỗi server');
    }
};