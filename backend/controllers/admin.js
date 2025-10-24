const pool = require('../db');
const bcrypt = require('bcryptjs');
const { sendReplyEmail } = require('../services/emailService');
// Lấy tất cả người dùng
exports.getAllUsers = async (req, res) => {
    try {
        const allUsers = await pool.query("SELECT id, full_name, email, role, created_at FROM users ORDER BY id ASC");
        res.json(allUsers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

// ==========================================================
// === HÀM LẤY THÔNG TIN ĐỂ SỬA (QUAN TRỌNG CHO VIỆC SỬA) ===
// ==========================================================
exports.getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await pool.query("SELECT id, full_name, email, role FROM users WHERE id = $1", [userId]);
        if (user.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy người dùng" });
        }
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

// Tạo người dùng mới (Giữ nguyên)
exports.createUser = async (req, res) => {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ msg: 'Vui lòng nhập đầy đủ thông tin' });
    }
    try {
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length > 0) {
            return res.status(400).json({ msg: "Email đã tồn tại" });
        }
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);
        const newUser = await pool.query(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, role",
            [fullName, email, bcryptPassword, role]
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error("LỖI KHI TẠO USER:", err.message);
        res.status(500).send("Lỗi server");
    }
};

// ==========================================================
// === HÀM CẬP NHẬT (QUAN TRỌNG CHO VIỆC SỬA) ===
// ==========================================================
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { fullName, email, role } = req.body; // Sửa `full_name` và `email`

        const updatedUser = await pool.query(
            "UPDATE users SET full_name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, full_name, email, role",
            [fullName, email, role, userId]
        );
        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error("LỖI KHI CẬP NHẬT USER:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// ==========================================================
// === HÀM XÓA (QUAN TRỌNG CHO VIỆC XÓA) ===
// ==========================================================
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    // Sử dụng một 'client' từ 'pool' để có thể thực hiện giao dịch (transaction)
    const client = await pool.connect(); 

    try {
        // Kiểm tra xem người dùng có tồn tại không và lấy vai trò của họ
        const userQuery = await client.query("SELECT role FROM users WHERE id = $1", [userId]);
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy người dùng để xóa" });
        }
        const userRole = userQuery.rows[0].role;

        // Thêm một quy tắc: không cho xóa giảng viên nếu họ đang sở hữu khóa học
        if (userRole === 'instructor') {
            const coursesQuery = await client.query("SELECT id FROM courses WHERE instructor_id = $1", [userId]);
            if (coursesQuery.rows.length > 0) {
                return res.status(400).json({ msg: "Không thể xóa giảng viên này vì họ đang quản lý các khóa học. Vui lòng gán lại khóa học cho giảng viên khác trước khi xóa." });
            }
        }

        // Bắt đầu một giao dịch
        await client.query('BEGIN');

        // Bắt đầu xóa tất cả dữ liệu liên quan theo đúng thứ tự

        // 1. Xóa các lượt thích, trả lời và câu hỏi của người dùng
        await client.query("DELETE FROM q_and_a_likes WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM q_and_a_replies WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM q_and_a_threads WHERE user_id = $1", [userId]);

        // 2. Xóa dữ liệu về việc hoàn thành bài học
        await client.query("DELETE FROM lesson_completions WHERE user_id = $1", [userId]);

        // 3. Xóa các khóa học yêu thích của người dùng
        await client.query("DELETE FROM favorite_courses WHERE user_id = $1", [userId]);

        // 4. Xóa lịch sử thanh toán liên quan đến các lần ghi danh của người dùng
        // (Phải xóa cái này trước khi xóa ghi danh)
        await client.query(
            `DELETE FROM payment_history 
             WHERE enrollment_id IN (SELECT id FROM enrollments WHERE user_id = $1)`,
            [userId]
        );

        // 5. Xóa các bản ghi ghi danh của người dùng (đây là bước khắc phục lỗi chính)
        await client.query("DELETE FROM enrollments WHERE user_id = $1", [userId]);

        // 6. Cuối cùng, khi không còn dữ liệu liên quan, xóa người dùng
        await client.query("DELETE FROM users WHERE id = $1", [userId]);

        // Nếu tất cả các lệnh trên thành công, xác nhận giao dịch
        await client.query('COMMIT'); 
        
        res.json({ msg: "Người dùng và tất cả dữ liệu liên quan đã được xóa thành công." });

    } catch (err) {
        // Nếu có bất kỳ lỗi nào xảy ra, hủy bỏ tất cả các thay đổi đã thực hiện
        await client.query('ROLLBACK'); 
        console.error("LỖI KHI XÓA USER:", err.message);
        res.status(500).send('Lỗi server');
    } finally {
        // Luôn giải phóng client trở lại pool dù thành công hay thất bại
        client.release(); 
    }
};
// Lấy danh sách giảng viên
exports.getAllInstructors = async (req, res) => {
    try {
        const instructors = await pool.query("SELECT id, full_name FROM users WHERE role = 'instructor'");
        res.json(instructors.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

// Admin tạo khóa học mới
exports.createCourse = async (req, res) => {
    const { title, description, level, cuisine, price, image_url, instructor_id } = req.body;
    // Kiểm tra các trường bắt buộc
    if (!title || !description || !price || !instructor_id) {
        return res.status(400).json({ msg: 'Vui lòng điền các trường bắt buộc: Tên, Mô tả, Giá, và Giảng viên.' });
    }
    try {
        const newCourse = await pool.query(
            "INSERT INTO courses (title, description, level, cuisine, price, image_url, instructor_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [title, description, level, cuisine, price, image_url, instructor_id]
        );
        res.status(201).json(newCourse.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

// Admin cập nhật khóa học (Hàm này sẽ được dùng bởi trang EditCoursePage)
exports.updateCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        // Thêm live_embed_url vào đây
        const { title, description, level, cuisine, price, image_url, instructor_id, live_embed_url } = req.body;
        const updatedCourse = await pool.query(
            // Thêm live_embed_url vào câu lệnh UPDATE
            "UPDATE courses SET title = $1, description = $2, level = $3, cuisine = $4, price = $5, image_url = $6, instructor_id = $7, live_embed_url = $8 WHERE id = $9 RETURNING *",
            [title, description, level, cuisine, price, image_url, instructor_id, live_embed_url, courseId]
        );
        if (updatedCourse.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy khóa học" });
        }
        res.json(updatedCourse.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};


// Admin xóa khóa học
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const deleteResult = await pool.query("DELETE FROM courses WHERE id = $1", [courseId]);
        if (deleteResult.rowCount === 0) {
             return res.status(404).json({ msg: "Không tìm thấy khóa học để xóa." });
        }
        res.json({ msg: "Khóa học đã được xóa thành công." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};
// Lấy tất cả bình luận (cả câu hỏi và trả lời)
exports.getAllComments = async (req, res) => {
    try {
        // Lấy tất cả câu hỏi gốc (threads)
        const threads = await pool.query(`
            SELECT 'thread' as type, t.id, t.question_text as text, u.full_name as author, t.created_at, l.title as lesson_title, c.id as course_id
            FROM q_and_a_threads t
            JOIN users u ON t.user_id = u.id
            JOIN lessons l ON t.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
        `);

        // Lấy tất cả các câu trả lời (replies)
        const replies = await pool.query(`
            SELECT 'reply' as type, r.id, r.reply_text as text, u.full_name as author, r.created_at, l.title as lesson_title, c.id as course_id
            FROM q_and_a_replies r
            JOIN users u ON r.user_id = u.id
            JOIN q_and_a_threads t ON r.thread_id = t.id
            JOIN lessons l ON t.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
        `);

        // Gộp hai kết quả và sắp xếp theo ngày tạo mới nhất
        const allComments = [...threads.rows, ...replies.rows];
        allComments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json(allComments);
    } catch (err) {
        console.error("Lỗi khi lấy danh sách bình luận:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// Xóa một bình luận (câu hỏi hoặc trả lời)
exports.deleteComment = async (req, res) => {
    try {
        const { type, id } = req.params;

        if (type === 'thread') {
            await pool.query("DELETE FROM q_and_a_threads WHERE id = $1", [id]);
        } else if (type === 'reply') {
            await pool.query("DELETE FROM q_and_a_replies WHERE id = $1", [id]);
        } else {
            return res.status(400).json({ msg: 'Loại bình luận không hợp lệ.' });
        }

        res.json({ msg: 'Đã xóa bình luận thành công.' });
    } catch (err) {
        console.error("Lỗi khi xóa bình luận:", err.message);
        res.status(500).send('Lỗi server');
    }
};
// Lấy danh sách chỉ có giảng viên
exports.getInstructors = async (req, res) => {
    try {
        const instructors = await pool.query(
            "SELECT id, full_name, email, created_at FROM users WHERE role = 'instructor' ORDER BY id ASC"
        );
        res.json(instructors.rows);
    } catch (err) {
        console.error("Lỗi khi lấy danh sách giảng viên:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// Tạo một giảng viên mới
exports.createInstructor = async (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
        return res.status(400).json({ msg: 'Vui lòng nhập đầy đủ thông tin' });
    }
    try {
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length > 0) {
            return res.status(400).json({ msg: "Email đã tồn tại" });
        }
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);
        const newInstructor = await pool.query(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, 'instructor') RETURNING id, full_name, email, role",
            [fullName, email, bcryptPassword]
        );
        res.status(201).json(newInstructor.rows[0]);
    } catch (err) {
        console.error("Lỗi khi tạo giảng viên:", err.message);
        res.status(500).send("Lỗi server");
    }
};

// Cập nhật thông tin giảng viên
exports.updateInstructor = async (req, res) => {
    try {
        const { instructorId } = req.params;
        const { fullName, email } = req.body;

        const updatedInstructor = await pool.query(
            "UPDATE users SET full_name = $1, email = $2 WHERE id = $3 AND role = 'instructor' RETURNING id, full_name, email, role",
            [fullName, email, instructorId]
        );
        if (updatedInstructor.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy giảng viên" });
        }
        res.json(updatedInstructor.rows[0]);
    } catch (err) {
        console.error("Lỗi khi cập nhật giảng viên:", err.message);
        res.status(500).send('Lỗi server');
    }
};


// Xóa giảng viên (có kiểm tra ràng buộc)
exports.deleteInstructor = async (req, res) => {
    try {
        const { instructorId } = req.params;
        
        // 1. Kiểm tra xem giảng viên này có đang phụ trách khóa học nào không
        const courseCheck = await pool.query("SELECT id FROM courses WHERE instructor_id = $1", [instructorId]);
        if (courseCheck.rows.length > 0) {
            return res.status(400).json({ msg: 'Không thể xóa giảng viên này vì họ đang quản lý các khóa học. Vui lòng gán lại các khóa học đó cho người khác trước khi xóa.' });
        }

        // 2. Nếu không, tiến hành xóa
        const deleteResult = await pool.query("DELETE FROM users WHERE id = $1 AND role = 'instructor'", [instructorId]);
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ msg: "Không tìm thấy giảng viên để xóa" });
        }
        res.json({ msg: "Giảng viên đã được xóa thành công." });
    } catch (err) {
        console.error("Lỗi khi xóa giảng viên:", err.message);
        res.status(500).send('Lỗi server');
    }
};
exports.getRevenueStats = async (req, res) => {
    try {
        // 1. Tính tổng doanh thu từ tất cả các giao dịch đã hoàn thành
        const totalRevenueQuery = await pool.query(
            "SELECT SUM(amount) AS total FROM payment_history WHERE status = 'Đã hoàn thành'"
        );
        const totalRevenue = totalRevenueQuery.rows[0].total || 0;

        // 2. Lấy 10 giao dịch thành công gần nhất để hiển thị
        const recentTransactionsQuery = await pool.query(
            `SELECT 
                p.id, p.amount, p.payment_date,
                c.title AS course_title,
                u.full_name AS user_name
             FROM payment_history p
             JOIN enrollments e ON p.enrollment_id = e.id
             JOIN courses c ON e.course_id = c.id
             JOIN users u ON e.user_id = u.id
             WHERE p.status = 'Đã hoàn thành'
             ORDER BY p.payment_date DESC
             LIMIT 10`
        );
        const recentTransactions = recentTransactionsQuery.rows;

        // 3. Gửi dữ liệu về cho client
        res.json({
            totalRevenue,
            recentTransactions
        });

    } catch (err) {
        console.error("Lỗi khi lấy thống kê doanh thu:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// HÀM MỚI: Lấy tất cả các loại đơn hàng (ĐÃ SỬA LỖI)
// HÀM ĐÃ SỬA: Chỉ lấy đơn hàng dụng cụ
exports.getAllOrders = async (req, res) => {
    try {
        // Chỉ lấy đơn hàng dụng cụ (tool_orders)
        const toolOrdersQuery = await pool.query(`
            SELECT
                o.id,
                u.full_name as customer_name,
                -- Tóm tắt tên sản phẩm từ JSON và xử lý trường hợp đơn hàng cũ
                CASE
                    WHEN o.transaction_code IS NOT NULL AND o.transaction_code LIKE '[%' THEN
                        (SELECT STRING_AGG(CONCAT(item ->> 'name', ' x', item ->> 'quantity'), ', ')
                         FROM json_array_elements(o.transaction_code::json) AS item)
                    ELSE -- Fallback cho các đơn hàng cũ không có JSON
                        (SELECT kt.name FROM kitchen_tools kt WHERE kt.id = o.tool_id)
                END as item_name,
                o.total_amount,
                o.status,
                o.created_at
            FROM tool_orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);

        res.json(toolOrdersQuery.rows);
    } catch (err) {
        console.error("Lỗi khi lấy đơn hàng dụng cụ:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// HÀM ĐÃ SỬA: Chỉ lấy chi tiết đơn hàng dụng cụ
exports.getOrderDetails = async (req, res) => {
    const { id } = req.params; // Bỏ 'type'

    try {
        const query = await pool.query(`
            SELECT
                o.id,
                u.full_name as customer_name,
                u.email as customer_email,
                u.phone_number as customer_phone,
                o.total_amount,
                o.status,
                o.created_at,
                o.shipping_address,
                o.transaction_code as items_json,
                o.tool_id -- Giữ lại để xử lý đơn hàng cũ
            FROM tool_orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = $1
        `, [id]);
        
        if (query.rows.length === 0) {
            return res.status(404).json({ msg: 'Không tìm thấy đơn hàng.' });
        }

        let orderDetails = query.rows[0];
        
        try {
            if (orderDetails.items_json && orderDetails.items_json.startsWith('[')) {
                orderDetails.items = JSON.parse(orderDetails.items_json);
            } else {
                // Fallback cho đơn hàng cũ: Tạo lại danh sách items từ thông tin có sẵn
                const toolRes = await pool.query("SELECT name, price FROM kitchen_tools WHERE id = $1", [orderDetails.tool_id]);
                const toolName = toolRes.rows.length > 0 ? toolRes.rows[0].name : "Sản phẩm không xác định";
                const toolPrice = toolRes.rows.length > 0 ? toolRes.rows[0].price : orderDetails.total_amount;
                orderDetails.items = [{ name: toolName, quantity: 1, price: toolPrice }];
            }
        } catch (e) {
            orderDetails.items = [];
        }

        res.json(orderDetails);
    } catch (err) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// HÀM ĐÃ SỬA: Chỉ cập nhật trạng thái đơn hàng dụng cụ
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params; // Bỏ 'type'
    const { status } = req.body;

    try {
        const result = await pool.query(
            `UPDATE tool_orders SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Không tìm thấy đơn hàng.' });
        }

        res.json({ msg: 'Cập nhật trạng thái đơn hàng thành công.', order: result.rows[0] });
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", err.message);
        res.status(500).send('Lỗi server');
    }
};
// HÀM MỚI: Thống kê doanh thu theo từng sản phẩm dụng cụ
exports.getToolRevenueStats = async (req, res) => {
    try {
        // Lấy tất cả các đơn hàng dụng cụ đã hoàn thành hoặc đang giao
        const completedOrders = await pool.query(
            "SELECT transaction_code FROM tool_orders WHERE status = 'completed' OR status = 'shipped'"
        );

        const productStats = {}; // Dùng để lưu trữ dạng { product_id: { quantity: X, revenue: Y } }

        // Duyệt qua từng đơn hàng để xử lý
        for (const order of completedOrders.rows) {
            // Chỉ xử lý các đơn hàng mới có cấu trúc JSON
            if (order.transaction_code && order.transaction_code.startsWith('[')) {
                try {
                    const items = JSON.parse(order.transaction_code);
                    for (const item of items) {
                        const productId = item.id;
                        const quantity = parseInt(item.quantity, 10);
                        const price = parseFloat(item.price);

                        if (!productStats[productId]) {
                            productStats[productId] = { quantity: 0, revenue: 0 };
                        }
                        productStats[productId].quantity += quantity;
                        productStats[productId].revenue += quantity * price;
                    }
                } catch (e) {
                    console.error("Lỗi khi parsing JSON của đơn hàng:", order.id, e);
                }
            }
        }

        // Chuyển đổi object productStats thành mảng và lấy tên sản phẩm
        const productIds = Object.keys(productStats);
        if (productIds.length === 0) {
            return res.json([]); // Trả về mảng rỗng nếu không có dữ liệu
        }

        const productDetails = await pool.query(
            `SELECT id, name FROM kitchen_tools WHERE id IN (${productIds.join(',')})`
        );
        
        const productNameMap = {};
        productDetails.rows.forEach(p => {
            productNameMap[p.id] = p.name;
        });

        const result = productIds.map(id => ({
            id: id,
            name: productNameMap[id] || 'Sản phẩm không xác định',
            quantity_sold: productStats[id].quantity,
            total_revenue: productStats[id].revenue
        })).sort((a, b) => b.total_revenue - a.total_revenue); // Sắp xếp theo doanh thu giảm dần

        res.json(result);

    } catch (err) {
        console.error("Lỗi khi lấy thống kê doanh thu dụng cụ:", err.message);
        res.status(500).send('Lỗi server');
    }
};
// HÀM MỚI: Lấy tất cả tin nhắn liên hệ
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
        res.json(messages.rows);
    } catch (err) {
        console.error("Lỗi khi lấy tin nhắn:", err.message);
        res.status(500).send('Lỗi server');
    }
};
// HÀM MỚI: Lấy một tin nhắn đơn lẻ
exports.getSingleMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const messageQuery = await pool.query("SELECT * FROM contact_messages WHERE id = $1", [id]);
        if (messageQuery.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy tin nhắn." });
        }
        res.json(messageQuery.rows[0]);
    } catch (err) {
        console.error("Lỗi khi lấy tin nhắn đơn lẻ:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// HÀM MỚI: Phản hồi tin nhắn
exports.replyToMessage = async (req, res) => {
    const { id } = req.params;
    const { replyContent } = req.body;
    const adminName = req.user.full_name || 'Admin'; // Lấy tên admin đang đăng nhập

    try {
        // 1. Lấy thông tin người nhận
        const messageQuery = await pool.query("SELECT sender_name, sender_email, subject FROM contact_messages WHERE id = $1", [id]);
        if (messageQuery.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy tin nhắn gốc." });
        }
        const message = messageQuery.rows[0];

        // 2. Chuẩn bị nội dung email
        const subject = `Re: ${message.subject}`;
        const html = `
            <p>Chào ${message.sender_name},</p>
            <p>Cảm ơn bạn đã liên hệ với Bếp của Quân. Dưới đây là phản hồi từ chúng tôi:</p>
            <div style="border-left: 4px solid #ccc; padding-left: 16px; margin: 16px 0; font-style: italic;">
                ${replyContent}
            </div>
            <p>Trân trọng,<br/>Đội ngũ Bếp của Quân</p>
        `;

        // 3. Gửi email
        await sendReplyEmail(message.sender_email, subject, html);

        // 4. Cập nhật trạng thái tin nhắn thành "đã trả lời"
        await pool.query("UPDATE contact_messages SET is_replied = TRUE, is_read = TRUE WHERE id = $1", [id]);

        res.json({ msg: "Gửi phản hồi thành công!" });

    } catch (err) {
        console.error("Lỗi khi gửi phản hồi:", err.message);
        res.status(500).send('Lỗi server');
    }
};