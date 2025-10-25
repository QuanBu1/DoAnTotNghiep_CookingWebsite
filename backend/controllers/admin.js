const pool = require('../db');
const bcrypt = require('bcryptjs');
const { sendReplyEmail } = require('../services/emailService'); // Giữ nguyên service email

// Helper function to build WHERE clause for search and filter
// (Hàm trợ giúp xây dựng mệnh đề WHERE linh hoạt)
const buildWhereClause = (search, filter, searchFields, filterField) => {
    let whereClause = '';
    const queryParams = [];
    let paramIndex = 1;

    // Build filter part (Xây dựng phần lọc)
    if (filterField && filter && filter !== 'all') {
        whereClause += ` WHERE ${filterField} = $${paramIndex++}`;
        queryParams.push(filter);
    }

    // Build search part (Xây dựng phần tìm kiếm)
    if (search && searchFields.length > 0) {
        const searchCondition = searchFields
            .map(field => `${field} ILIKE $${paramIndex++}`)
            .join(' OR ');
        whereClause += (whereClause ? ' AND' : ' WHERE') + ` (${searchCondition})`;
        // Add search term for each field (Thêm giá trị tìm kiếm cho mỗi trường)
        searchFields.forEach(() => queryParams.push(`%${search}%`));
    }

    return { whereClause, queryParams, paramIndex };
};

// =============================================
// QUẢN LÝ NGƯỜI DÙNG (USERS) - ĐÃ CÓ PHÂN TRANG, TÌM KIẾM, LỌC
// =============================================
exports.getAllUsers = async (req, res) => {
    const { search = '', filter = 'all', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const searchFields = ['full_name', 'email'];
        const filterField = 'role';

        // 1. Build WHERE clause (Xây dựng mệnh đề WHERE)
        const { whereClause, queryParams, paramIndex } = buildWhereClause(search, filter, searchFields, filterField);

        // 2. Query for total items (Truy vấn tổng số lượng)
        const totalQuery = `SELECT COUNT(*) FROM users${whereClause}`;
        const totalResult = await pool.query(totalQuery, queryParams);
        const totalItems = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        // 3. Query for paginated items (Truy vấn dữ liệu theo trang)
        const dataQuery = `
            SELECT id, full_name, email, role, created_at
            FROM users
            ${whereClause}
            ORDER BY id ASC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);

        res.json({
            data: dataResult.rows,
            pagination: {
                currentPage: parseInt(page, 10),
                totalPages,
                totalItems,
                limit: parseInt(limit, 10)
            }
        });
    } catch (err) {
        console.error("Lỗi khi lấy danh sách người dùng:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// getUserById, createUser, updateUser, deleteUser giữ nguyên logic cơ bản
// (Có thể cần điều chỉnh deleteUser nếu có ràng buộc phức tạp hơn trong tương lai)
// Lấy thông tin user theo ID (Giữ nguyên)
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
// Cập nhật người dùng (Giữ nguyên)
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
// Xóa người dùng (Logic xóa liên quan giữ nguyên)
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    const client = await pool.connect();
    try {
        const userQuery = await client.query("SELECT role FROM users WHERE id = $1", [userId]);
        if (userQuery.rows.length === 0) {
            client.release(); // Release client before returning
            return res.status(404).json({ msg: "Không tìm thấy người dùng để xóa" });
        }
        const userRole = userQuery.rows[0].role;
        if (userRole === 'instructor') {
            const coursesQuery = await client.query("SELECT id FROM courses WHERE instructor_id = $1", [userId]);
            if (coursesQuery.rows.length > 0) {
                client.release(); // Release client before returning
                return res.status(400).json({ msg: "Không thể xóa giảng viên này vì họ đang quản lý các khóa học. Vui lòng gán lại khóa học cho giảng viên khác trước khi xóa." });
            }
        }
        await client.query('BEGIN');
        // Delete related data in correct order
        await client.query("DELETE FROM recipe_reactions WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM saved_recipes WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM recipe_comments WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM q_and_a_likes WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM q_and_a_replies WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM q_and_a_threads WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM lesson_completions WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM favorite_courses WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM practice_submissions WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM payment_history WHERE enrollment_id IN (SELECT id FROM enrollments WHERE user_id = $1)",[userId]);
        await client.query("DELETE FROM enrollments WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM tool_orders WHERE user_id = $1", [userId]);
        await client.query("DELETE FROM notifications WHERE user_id = $1", [userId]);
        // Consider deleting user_recipes if necessary, or nullifying user_id
        // await client.query("DELETE FROM user_recipes WHERE user_id = $1", [userId]); // Uncomment if recipes should be deleted
        await client.query("DELETE FROM users WHERE id = $1", [userId]);
        await client.query('COMMIT');
        res.json({ msg: "Người dùng và tất cả dữ liệu liên quan đã được xóa thành công." });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("LỖI KHI XÓA USER:", err.message);
        res.status(500).send('Lỗi server');
    } finally {
        client.release(); // Ensure client is always released
    }
};


// =============================================
// QUẢN LÝ GIẢNG VIÊN (INSTRUCTORS) - ĐÃ CÓ PHÂN TRANG, TÌM KIẾM
// =============================================
exports.getInstructors = async (req, res) => {
    const { search = '', page = 1, limit = 10 } = req.query; // Chỉ cần tìm kiếm theo tên/email
    const offset = (page - 1) * limit;

    try {
        const searchFields = ['full_name', 'email'];
        const filterField = null; // Không lọc theo vai trò vì đã cố định là instructor

        // 1. Build WHERE clause
        const { whereClause: searchWhere, queryParams: searchParams } = buildWhereClause(search, null, searchFields, filterField);

        // Luôn lọc theo role = 'instructor'
        const baseWhere = " WHERE role = 'instructor'";
        // Correctly combine base and search clauses
        let finalWhere = baseWhere;
        if (searchWhere) {
            // Remove the initial ' WHERE ' from searchWhere before combining
            finalWhere += ` AND (${searchWhere.substring(7)})`;
        }
        const finalParams = searchParams; // Chỉ dùng searchParams

        // 2. Query for total items
        const totalQuery = `SELECT COUNT(*) FROM users${finalWhere}`;
        const totalResult = await pool.query(totalQuery, finalParams);
        const totalItems = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        // 3. Query for paginated items
        const dataQuery = `
            SELECT id, full_name, email, created_at
            FROM users
            ${finalWhere}
            ORDER BY id ASC
            LIMIT $${finalParams.length + 1} OFFSET $${finalParams.length + 2}
        `;
        const dataResult = await pool.query(dataQuery, [...finalParams, limit, offset]);

        res.json({
            data: dataResult.rows,
            pagination: {
                currentPage: parseInt(page, 10),
                totalPages,
                totalItems,
                limit: parseInt(limit, 10)
            }
        });
    } catch (err) {
        console.error("Lỗi khi lấy danh sách giảng viên:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// createInstructor, updateInstructor, deleteInstructor giữ nguyên
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
exports.deleteInstructor = async (req, res) => {
    // Note: The logic inside deleteUser already handles preventing deletion if they own courses.
    // This function might be redundant or could call deleteUser internally after checking role.
    // For simplicity, we keep the original logic but ensure deleteUser handles constraints.
    try {
        const { instructorId } = req.params;
        // Re-check course ownership here as a safeguard, though deleteUser also checks
        const courseCheck = await pool.query("SELECT id FROM courses WHERE instructor_id = $1", [instructorId]);
        if (courseCheck.rows.length > 0) {
            return res.status(400).json({ msg: 'Không thể xóa giảng viên này vì họ đang quản lý các khóa học. Vui lòng gán lại các khóa học đó cho người khác trước khi xóa.' });
        }

        // Call the main deleteUser function which handles all related data deletion
        // We simulate req/res objects for deleteUser
        const mockReq = { params: { userId: instructorId } };
        const mockRes = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(data) { res.status(this.statusCode || 200).json(data); },
            send: function(data) { res.status(this.statusCode || 500).send(data); }
        };
        await exports.deleteUser(mockReq, mockRes); // Call the robust deleteUser

    } catch (err) { // Catch errors specific to the deleteInstructor wrapper
        console.error("Lỗi khi gọi hàm xóa giảng viên:", err.message);
        if (!res.headersSent) { // Ensure we don't send multiple responses
             res.status(500).send('Lỗi server khi cố gắng xóa giảng viên.');
        }
    }
};

// =============================================
// QUẢN LÝ KHÓA HỌC (COURSES) - ĐÃ CÓ PHÂN TRANG, TÌM KIẾM, LỌC THEO GIẢNG VIÊN
// =============================================
// Hàm lấy danh sách giảng viên (để dùng cho bộ lọc)
exports.getAllInstructors = async (req, res) => {
    try {
        // Chỉ lấy ID và tên để làm bộ lọc
        const instructors = await pool.query("SELECT id, full_name FROM users WHERE role = 'instructor' ORDER BY full_name ASC");
        res.json(instructors.rows);
    } catch (err) {
        console.error("Lỗi khi lấy danh sách giảng viên:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// Hàm lấy danh sách khóa học (có phân trang, tìm kiếm, lọc)
exports.getAllCourses = async (req, res) => {
    const { search = '', filter = 'all', page = 1, limit = 10 } = req.query; // filter ở đây là instructor_id
    const offset = (page - 1) * limit;

    try {
        const searchFields = ['c.title', 'c.description']; // Tìm kiếm trong title và description của courses (c)
        const filterField = 'c.instructor_id'; // Lọc theo instructor_id của courses (c)

        // 1. Build WHERE clause
        const { whereClause, queryParams, paramIndex } = buildWhereClause(search, filter, searchFields, filterField);

        // 2. Query for total items
        // Cần JOIN để có thể lọc theo instructor_id nhưng chỉ COUNT trên bảng courses
        const totalQuery = `SELECT COUNT(c.id) FROM courses c ${whereClause}`; // Chỉ cần WHERE clause ở đây
        const totalResult = await pool.query(totalQuery, queryParams); // Chỉ cần queryParams ở đây
        const totalItems = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        // 3. Query for paginated items (JOIN với users để lấy tên giảng viên)
        const dataQuery = `
            SELECT c.id, c.title, c.price, u.full_name AS instructor_name
            FROM courses c
            JOIN users u ON c.instructor_id = u.id
            ${whereClause}
            ORDER BY c.id DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);

        res.json({
            data: dataResult.rows,
            pagination: {
                currentPage: parseInt(page, 10),
                totalPages,
                totalItems,
                limit: parseInt(limit, 10)
            }
        });
    } catch (err) {
        console.error("Lỗi khi lấy danh sách khóa học:", err.message);
        res.status(500).send('Lỗi server');
    }
};


// createCourse, updateCourse, deleteCourse giữ nguyên
exports.createCourse = async (req, res) => {
    const { title, description, level, cuisine, price, image_url, instructor_id } = req.body;
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
exports.updateCourse = async (req, res) => {
    // Giữ nguyên logic updateCourse (bao gồm cả xử lý livestream notification)
     const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { courseId } = req.params;
        const { title, description, level, cuisine, cooking_style, price, image_url, live_embed_url, instructor_id } = req.body; // Added instructor_id

        const oldCourse = await client.query("SELECT live_embed_url, title FROM courses WHERE id = $1", [courseId]);
         if (oldCourse.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: "Không tìm thấy khóa học" });
        }
        const oldLink = oldCourse.rows[0]?.live_embed_url;
        const courseTitle = oldCourse.rows[0]?.title;

        const updatedCourseResult = await client.query(
            "UPDATE courses SET title = $1, description = $2, level = $3, cuisine = $4, cooking_style = $5, price = $6, image_url = $7, live_embed_url = $8, instructor_id = $10 WHERE id = $9 RETURNING *", // Added instructor_id=$10
            [title, description, level, cuisine, cooking_style, price, image_url, live_embed_url, courseId, instructor_id] // Added instructor_id
        );

        if (!oldLink && live_embed_url) {
            const sendNotification = req.app?.get('sendNotification'); // Safer access
            if (sendNotification) {
                 const enrolledUsers = await client.query(
                    "SELECT user_id FROM enrollments WHERE course_id = $1 AND status = 'da xac nhan'",
                    [courseId]
                 );
                 for (const user of enrolledUsers.rows) {
                    const message = `Khóa học "${courseTitle || title}" sắp có livestream!`; // Use updated title if old one wasn't fetched correctly
                    const link = `/courses/${courseId}`;
                    const type = 'livestream_scheduled'; // Add type
                    const newNotifResult = await client.query(
                        "INSERT INTO notifications (user_id, message, link, type) VALUES ($1, $2, $3, $4) RETURNING *", // Add type
                        [user.user_id, message, link, type] // Add type
                    );
                    sendNotification(user.user_id, newNotifResult.rows[0]);
                 }
            } else {
                 console.warn("sendNotification function not found in app context. Real-time notifications disabled.");
            }
        }

        await client.query('COMMIT');
        res.json(updatedCourseResult.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Lỗi khi cập nhật khóa học:", err.message);
        res.status(500).send('Lỗi server');
    } finally {
        client.release();
    }
};
exports.deleteCourse = async (req, res) => {
    // Giữ nguyên logic deleteCourse (transaction xóa các bảng liên quan)
    const { courseId } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query("DELETE FROM q_and_a_likes WHERE thread_id IN (SELECT id FROM q_and_a_threads WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = $1))", [courseId]);
        await client.query("DELETE FROM q_and_a_replies WHERE thread_id IN (SELECT id FROM q_and_a_threads WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = $1))", [courseId]);
        await client.query("DELETE FROM q_and_a_threads WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = $1)", [courseId]);
        await client.query("DELETE FROM lesson_completions WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = $1)", [courseId]);
        await client.query("DELETE FROM lesson_images WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = $1)", [courseId]);
        await client.query("DELETE FROM practice_submissions WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = $1)", [courseId]);
        await client.query("DELETE FROM lessons WHERE course_id = $1", [courseId]);
        await client.query("DELETE FROM favorite_courses WHERE course_id = $1", [courseId]);
        await client.query("DELETE FROM payment_history WHERE enrollment_id IN (SELECT id FROM enrollments WHERE course_id = $1)", [courseId]);
        await client.query("DELETE FROM enrollments WHERE course_id = $1", [courseId]);
        const deleteResult = await client.query("DELETE FROM courses WHERE id = $1", [courseId]);
        await client.query('COMMIT');
        if (deleteResult.rowCount === 0) {
             return res.status(404).json({ msg: "Không tìm thấy khóa học để xóa." });
        }
        res.json({ msg: "Khóa học và tất cả dữ liệu liên quan đã được xóa thành công." });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Lỗi khi xóa khóa học:", err.message);
        res.status(500).send('Lỗi server');
    } finally {
        client.release();
    }
};


// =============================================
// QUẢN LÝ DỤNG CỤ (TOOLS) - ĐÃ CÓ PHÂN TRANG, TÌM KIẾM
// =============================================
// Hàm getAllTools đã được cập nhật logic phân trang/tìm kiếm
exports.getAllTools = async (req, res) => {
    const { search = '', page = 1, limit = 10 } = req.query; // Chỉ cần tìm kiếm
    const offset = (page - 1) * limit;

    try {
        const searchFields = ['name', 'description', 'features', 'long_description']; // Mở rộng tìm kiếm
        const filterField = null; // Không có bộ lọc cho dụng cụ

        // 1. Build WHERE clause
        const { whereClause, queryParams, paramIndex } = buildWhereClause(search, null, searchFields, filterField);

        // 2. Query for total items
        const totalQuery = `SELECT COUNT(*) FROM kitchen_tools${whereClause}`;
        const totalResult = await pool.query(totalQuery, queryParams);
        const totalItems = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        // 3. Query for paginated items
        const dataQuery = `
            SELECT id, name, price, purchase_link, image_url
            FROM kitchen_tools
            ${whereClause}
            ORDER BY id DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);

        res.json({
            data: dataResult.rows,
            pagination: {
                currentPage: parseInt(page, 10),
                totalPages,
                totalItems,
                limit: parseInt(limit, 10)
            }
        });
    } catch (err) {
        console.error("Lỗi khi lấy danh sách dụng cụ:", err.message);
        res.status(500).send('Lỗi server');
    }
};


// getToolById, createTool, updateTool, deleteTool giữ nguyên
exports.getToolById = async (req, res) => {
    try {
        const { id } = req.params;
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
exports.createTool = async (req, res) => {
     const { name, description, image_url, purchase_link, price, features, long_description } = req.body;
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
        console.error("Lỗi khi tạo dụng cụ:", err.message);
        res.status(500).send('Lỗi server');
    }
};
exports.updateTool = async (req, res) => {
    const { id } = req.params;
    const { name, description, image_url, purchase_link, price, features, long_description } = req.body;
    const toolIdInt = parseInt(id, 10);
    if (isNaN(toolIdInt) || toolIdInt <= 0) {
        return res.status(400).json({ msg: "ID dụng cụ không hợp lệ." });
    }
    try {
        const updatedTool = await pool.query(
            "UPDATE kitchen_tools SET name = $1, description = $2, image_url = $3, purchase_link = $4, price = $5, features = $6, long_description = $7 WHERE id = $8 RETURNING *",
            [name, description, image_url, purchase_link, price, features, long_description, toolIdInt]
        );
        if (updatedTool.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy dụng cụ." });
        }
        res.json(updatedTool.rows[0]);
    } catch (err) {
        console.error("Lỗi khi cập nhật dụng cụ:", err.message);
        res.status(500).send('Lỗi server');
    }
};
exports.deleteTool = async (req, res) => {
     const { id } = req.params;
    const toolIdInt = parseInt(id, 10);
    if (isNaN(toolIdInt) || toolIdInt <= 0) {
        return res.status(400).json({ msg: "ID dụng cụ không hợp lệ." });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Delete related tool orders first
        await client.query("DELETE FROM tool_orders WHERE tool_id = $1 OR transaction_code::text LIKE $2", [toolIdInt, `%"id":${toolIdInt}%`]);
        // Then delete the tool
        const deleteOp = await client.query("DELETE FROM kitchen_tools WHERE id = $1", [toolIdInt]);
        await client.query('COMMIT');

        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ msg: "Không tìm thấy dụng cụ." });
        }
        res.json({ msg: "Đã xóa dụng cụ và các đơn hàng liên quan thành công." });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Lỗi khi xóa dụng cụ:", err.message);
        res.status(500).send('Lỗi server');
    } finally {
         client.release();
    }
};


// =============================================
// QUẢN LÝ ĐƠN HÀNG (ORDERS) - ĐÃ CÓ PHÂN TRANG, TÌM KIẾM, LỌC THEO TRẠNG THÁI
// =============================================
// Hàm getAllOrders đã được cập nhật logic
exports.getAllOrders = async (req, res) => {
    const { search = '', filter = 'all', page = 1, limit = 10 } = req.query; // filter là status
    const offset = (page - 1) * limit;

    try {
        // Tìm kiếm trong tên khách hàng hoặc tóm tắt sản phẩm JSON
        // Ensure aliases match the fields used in buildWhereClause
        const searchFields = ['u.full_name', `CASE
                    WHEN o.transaction_code IS NOT NULL AND o.transaction_code LIKE '[%' THEN
                        (SELECT STRING_AGG(CONCAT(item ->> 'name', ' x', item ->> 'quantity'), ', ')
                         FROM json_array_elements(o.transaction_code::json) AS item)
                    ELSE
                        (SELECT kt.name FROM kitchen_tools kt WHERE kt.id = o.tool_id LIMIT 1)
                END`]; // Search within the generated item_name
        const filterField = 'o.status';

        // 1. Build WHERE clause
        const { whereClause, queryParams, paramIndex } = buildWhereClause(search, filter, searchFields, filterField);

        // 2. Query for total items (JOIN để tìm kiếm/lọc)
        const totalQuery = `
            SELECT COUNT(o.id)
            FROM tool_orders o
            JOIN users u ON o.user_id = u.id
            ${whereClause}
        `;
        const totalResult = await pool.query(totalQuery, queryParams);
        const totalItems = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        // 3. Query for paginated items
        const dataQuery = `
            SELECT
                o.id,
                u.full_name as customer_name,
                CASE
                    WHEN o.transaction_code IS NOT NULL AND o.transaction_code LIKE '[%' THEN
                        (SELECT STRING_AGG(CONCAT(item ->> 'name', ' x', item ->> 'quantity'), ', ')
                         FROM json_array_elements(o.transaction_code::json) AS item)
                    ELSE
                        (SELECT kt.name FROM kitchen_tools kt WHERE kt.id = o.tool_id LIMIT 1) -- Thêm LIMIT 1
                END as item_name,
                o.total_amount,
                o.status,
                o.created_at
            FROM tool_orders o
            JOIN users u ON o.user_id = u.id
            ${whereClause}
            ORDER BY o.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);

        res.json({
            data: dataResult.rows,
            pagination: {
                currentPage: parseInt(page, 10),
                totalPages,
                totalItems,
                limit: parseInt(limit, 10)
            }
        });
    } catch (err) {
        console.error("Lỗi khi lấy đơn hàng dụng cụ:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// getOrderDetails, updateOrderStatus giữ nguyên
exports.getOrderDetails = async (req, res) => {
    const { id } = req.params; // Lấy ID đơn hàng từ params

    try {
        // Câu lệnh SQL chỉ truy vấn từ tool_orders và join với users
        const query = await pool.query(`
            SELECT
                o.id,
                'tool' as order_type, -- Hardcode order_type vì hàm này chỉ dành cho tool orders
                u.full_name as customer_name,
                u.email as customer_email,
                u.phone_number as customer_phone,
                o.total_amount,
                o.status,
                o.created_at,
                o.shipping_address,
                o.transaction_code as items_json, -- JSON chứa chi tiết items
                o.tool_id, -- Giữ lại để xử lý đơn hàng cũ (không có JSON)
                o.quantity, -- Cột cũ
                o.tool_price -- Cột cũ
            FROM tool_orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = $1
        `, [id]);

        if (query.rows.length === 0) {
            return res.status(404).json({ msg: 'Không tìm thấy đơn hàng dụng cụ.' });
        }

        let orderDetails = query.rows[0];

        // Xử lý parse JSON items hoặc fallback cho đơn hàng cũ (logic này giữ nguyên)
        try {
            if (orderDetails.items_json && orderDetails.items_json.startsWith('[')) {
                orderDetails.items = JSON.parse(orderDetails.items_json);
            } else {
                // Fallback cho đơn hàng cũ: Tạo lại danh sách items từ thông tin có sẵn
                const toolRes = await pool.query("SELECT name, price FROM kitchen_tools WHERE id = $1", [orderDetails.tool_id]);
                const toolName = toolRes.rows.length > 0 ? toolRes.rows[0].name : "Sản phẩm không xác định";
                // Sửa lỗi: lấy giá từ toolRes nếu có, nếu không thì dùng giá cũ từ order
                const toolPrice = toolRes.rows.length > 0 ? toolRes.rows[0].price : orderDetails.tool_price;
                orderDetails.items = [{ name: toolName, quantity: orderDetails.quantity || 1, price: toolPrice }];
            }
        } catch (e) {
            console.error("Lỗi parse JSON hoặc fallback đơn hàng:", e);
            orderDetails.items = [{ name: "Lỗi tải chi tiết", quantity: 1, price: orderDetails.total_amount }]; // Hiển thị lỗi thân thiện hơn
        }
        // Gán item_name để tương thích modal (lấy từ item đầu tiên)
        orderDetails.item_name = orderDetails.items?.[0]?.name || 'Chi tiết đơn hàng';


        res.json(orderDetails);
    } catch (err) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", err.message);
        res.status(500).send('Lỗi server');
    }
};
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        // Chỉ cập nhật tool_orders
        const result = await pool.query(
            `UPDATE tool_orders SET status = $1 WHERE id = $2 RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Không tìm thấy đơn hàng dụng cụ.' });
        }

        res.json({ msg: 'Cập nhật trạng thái đơn hàng dụng cụ thành công.', order: result.rows[0] });
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái đơn hàng:", err.message);
        res.status(500).send('Lỗi server');
    }
};


// =============================================
// QUẢN LÝ BÌNH LUẬN (COMMENTS) - ĐÃ CÓ PHÂN TRANG, TÌM KIẾM, LỌC THEO LOẠI
// =============================================
// Hàm getAllComments đã được cập nhật logic
exports.getAllComments = async (req, res) => {
    const { search = '', filter = 'all', page = 1, limit = 10 } = req.query; // filter là type ('thread'/'reply')
    const offset = (page - 1) * limit;

    try {
        // Build common parts for both queries (Xây dựng phần chung cho cả 2 truy vấn)
        let baseWhere = '';
        const queryParams = [];
        let paramIndex = 1;

        // Filtering by type (Lọc theo loại)
        if (filter !== 'all') {
            baseWhere = ` WHERE type = $${paramIndex++}`;
            queryParams.push(filter);
        }

        // Searching (Tìm kiếm trong nội dung hoặc tên tác giả)
        if (search) {
            // Correct parameter index for search
            const searchParamIndex = paramIndex;
            baseWhere += (baseWhere ? ' AND' : ' WHERE') + ` (text ILIKE $${searchParamIndex} OR author ILIKE $${searchParamIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++; // Increment after adding search param
        }


        // Subquery to combine threads and replies with necessary info
        // (Subquery để kết hợp threads và replies với thông tin cần thiết)
        const combinedQuery = `
            SELECT 'thread' as type, t.id, t.question_text as text, u.full_name as author, t.created_at, l.title as lesson_title, c.id as course_id, l.id as lesson_id
            FROM q_and_a_threads t
            JOIN users u ON t.user_id = u.id
            JOIN lessons l ON t.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            UNION ALL
            SELECT 'reply' as type, r.id, r.reply_text as text, u.full_name as author, r.created_at, l.title as lesson_title, c.id as course_id, l.id as lesson_id
            FROM q_and_a_replies r
            JOIN users u ON r.user_id = u.id
            JOIN q_and_a_threads t ON r.thread_id = t.id
            JOIN lessons l ON t.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
        `;

        // 1. Query for total items
        const totalQuery = `SELECT COUNT(*) FROM (${combinedQuery}) AS combined${baseWhere}`;
        const totalResult = await pool.query(totalQuery, queryParams);
        const totalItems = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        // 2. Query for paginated items
        // Correct parameter indices for LIMIT and OFFSET
        const limitParamIndex = paramIndex;
        const offsetParamIndex = paramIndex + 1;
        const dataQuery = `
            SELECT * FROM (${combinedQuery}) AS combined
            ${baseWhere}
            ORDER BY created_at DESC
            LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
        `;
        const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);


        res.json({
            data: dataResult.rows,
            pagination: {
                currentPage: parseInt(page, 10),
                totalPages,
                totalItems,
                limit: parseInt(limit, 10)
            }
        });
    } catch (err) {
        console.error("Lỗi khi lấy danh sách bình luận:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// deleteComment giữ nguyên
exports.deleteComment = async (req, res) => {
    try {
        const { type, id } = req.params;

        if (type === 'thread') {
            // Need transaction to delete replies first
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                await client.query("DELETE FROM q_and_a_likes WHERE thread_id = $1", [id]); // Also delete likes
                await client.query("DELETE FROM q_and_a_replies WHERE thread_id = $1", [id]);
                await client.query("DELETE FROM q_and_a_threads WHERE id = $1", [id]);
                await client.query('COMMIT');
            } catch (err) {
                await client.query('ROLLBACK');
                throw err; // Re-throw the error to be caught by the outer catch
            } finally {
                client.release();
            }
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


// =============================================
// QUẢN LÝ TIN NHẮN (MESSAGES) - ĐÃ CÓ PHÂN TRANG, TÌM KIẾM, LỌC THEO TRẠNG THÁI (read/replied)
// =============================================
// Hàm getAllMessages đã được cập nhật logic
exports.getAllMessages = async (req, res) => {
    const { search = '', filter = 'all', page = 1, limit = 10 } = req.query; // filter: all, new, read, replied
    const offset = (page - 1) * limit;

    try {
        const searchFields = ['sender_name', 'sender_email', 'subject', 'message'];
        let filterClause = '';
        const queryParams = [];
        let paramIndex = 1;

        // Build filter part
        if (filter === 'new') {
            filterClause = ' WHERE is_read = FALSE AND is_replied = FALSE';
        } else if (filter === 'read') {
            filterClause = ' WHERE is_read = TRUE AND is_replied = FALSE';
        } else if (filter === 'replied') {
            filterClause = ' WHERE is_replied = TRUE';
        }
        // 'all' doesn't need a filter clause

        // Build search part
        if (search) {
             // Correct parameter index for search
            const searchParamIndex = paramIndex;
            const searchCondition = searchFields
                .map(field => `${field} ILIKE $${searchParamIndex}`) // Use the same index
                .join(' OR ');
            filterClause += (filterClause ? ' AND' : ' WHERE') + ` (${searchCondition})`;
            queryParams.push(`%${search}%`); // Add only one search parameter
            paramIndex++; // Increment index after adding search param
        }


        // 1. Query for total items
        const totalQuery = `SELECT COUNT(*) FROM contact_messages${filterClause}`;
        const totalResult = await pool.query(totalQuery, queryParams);
        const totalItems = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        // 2. Query for paginated items
         // Correct parameter indices for LIMIT and OFFSET
        const limitParamIndex = paramIndex;
        const offsetParamIndex = paramIndex + 1;
        const dataQuery = `
            SELECT id, sender_name, sender_email, subject, message, created_at, is_read, is_replied
            FROM contact_messages
            ${filterClause}
            ORDER BY created_at DESC
            LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
        `;
        const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);


        res.json({
            data: dataResult.rows,
            pagination: {
                currentPage: parseInt(page, 10),
                totalPages,
                totalItems,
                limit: parseInt(limit, 10)
            }
        });
    } catch (err) {
        console.error("Lỗi khi lấy tin nhắn:", err.message);
        res.status(500).send('Lỗi server');
    }
};

// getSingleMessage, replyToMessage giữ nguyên
exports.getSingleMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const messageQuery = await pool.query("SELECT * FROM contact_messages WHERE id = $1", [id]);
        if (messageQuery.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy tin nhắn." });
        }
        // Mark as read when fetching single message
        await pool.query("UPDATE contact_messages SET is_read = TRUE WHERE id = $1 AND is_read = FALSE", [id]);
        res.json(messageQuery.rows[0]);
    } catch (err) {
        console.error("Lỗi khi lấy tin nhắn đơn lẻ:", err.message);
        res.status(500).send('Lỗi server');
    }
};
exports.replyToMessage = async (req, res) => {
    const { id } = req.params;
    const { replyContent } = req.body;
    // Lấy tên admin đang đăng nhập từ req.user (được gắn bởi authMiddleware)
    // Cần đảm bảo authMiddleware trả về full_name
    const adminFullName = req.user?.full_name || 'Admin Bếp của Quân';

    if (!replyContent || replyContent.trim() === '') {
        return res.status(400).json({ msg: 'Nội dung phản hồi không được để trống.' });
    }


    try {
        // 1. Lấy thông tin người nhận
        const messageQuery = await pool.query("SELECT sender_name, sender_email, subject FROM contact_messages WHERE id = $1", [id]);
        if (messageQuery.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy tin nhắn gốc." });
        }
        const message = messageQuery.rows[0];

        // 2. Chuẩn bị nội dung email
        const subject = `Re: ${message.subject || 'Phản hồi từ Bếp của Quân'}`; // Add fallback subject
        // Format HTML email nicely
        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <p>Chào ${message.sender_name || 'bạn'},</p>
                <p>Cảm ơn bạn đã liên hệ với Bếp của Quân. Dưới đây là phản hồi từ ${adminFullName}:</p>
                <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; font-style: italic;">
                    ${replyContent.replace(/\n/g, '<br>')}
                </div>
                <p>Nếu bạn có bất kỳ câu hỏi nào khác, đừng ngần ngại liên hệ lại nhé.</p>
                <p>Trân trọng,<br/>Đội ngũ Bếp của Quân</p>
                <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
                <p style="font-size: 0.8em; color: #777;">Email này được gửi tự động từ hệ thống phản hồi của Bếp của Quân.</p>
            </div>
        `;


        // 3. Gửi email (Sử dụng service đã import)
        await sendReplyEmail(message.sender_email, subject, html);

        // 4. Cập nhật trạng thái tin nhắn thành "đã trả lời" và "đã đọc"
        await pool.query("UPDATE contact_messages SET is_replied = TRUE, is_read = TRUE WHERE id = $1", [id]);

        res.json({ msg: "Gửi phản hồi thành công!" });

    } catch (err) {
        console.error("Lỗi khi gửi phản hồi:", err.message);
        // Check if it's an email sending error specifically
        if (err.message === 'Could not send email.') {
             res.status(502).send('Lỗi server: Không thể gửi email phản hồi.'); // Bad Gateway might be appropriate
        } else {
             res.status(500).send('Lỗi server khi xử lý phản hồi.');
        }
    }
};


// Các hàm thống kê giữ nguyên (không cần phân trang/tìm kiếm)
exports.getRevenueStats = async (req, res) => {
     try {
        const totalRevenueQuery = await pool.query(
            "SELECT SUM(amount) AS total FROM payment_history WHERE status = 'Đã hoàn thành'"
        );
        const totalRevenue = totalRevenueQuery.rows[0].total || 0;

        const recentTransactionsQuery = await pool.query(
            `SELECT
                p.id, p.amount, p.payment_date, p.enrollment_id, -- added enrollment_id
                c.title AS course_title, c.id AS course_id, -- added course_id
                u.full_name AS user_name, u.id AS user_id -- added user_id
             FROM payment_history p
             JOIN enrollments e ON p.enrollment_id = e.id
             JOIN courses c ON e.course_id = c.id
             JOIN users u ON e.user_id = u.id
             WHERE p.status = 'Đã hoàn thành'
             ORDER BY p.payment_date DESC
             LIMIT 10`
        );
        const recentTransactions = recentTransactionsQuery.rows;

        res.json({
            totalRevenue,
            recentTransactions
        });

    } catch (err) {
        console.error("Lỗi khi lấy thống kê doanh thu khóa học:", err.message);
        res.status(500).send('Lỗi server');
    }
};
exports.getToolRevenueStats = async (req, res) => {
    try {
        // Lấy tất cả các đơn hàng dụng cụ đã hoàn thành hoặc đang giao
        // Sửa: Chỉ lấy đơn hàng 'completed' để tính doanh thu thực
        const completedOrders = await pool.query(
            "SELECT transaction_code, total_amount, tool_id FROM tool_orders WHERE status = 'completed'" // Lấy thêm total_amount, tool_id
        );

        const productStats = {}; // Dùng để lưu trữ dạng { product_id: { quantity: X, revenue: Y } }

        // Duyệt qua từng đơn hàng để xử lý
        for (const order of completedOrders.rows) {
            // Xử lý cả đơn hàng mới (JSON) và cũ
            if (order.transaction_code && order.transaction_code.startsWith('[')) { // Đơn hàng mới
                try {
                    const items = JSON.parse(order.transaction_code);
                    for (const item of items) {
                        const productId = item.id;
                        // Validate item structure
                        if (productId === undefined || item.quantity === undefined || item.price === undefined) {
                             console.warn("Skipping invalid item in order (JSON):", order.id, item);
                             continue;
                        }

                        const quantity = parseInt(item.quantity, 10);
                        const price = parseFloat(item.price);

                        if (isNaN(quantity) || isNaN(price) || quantity <= 0) {
                            console.warn("Skipping item with invalid quantity/price (JSON):", order.id, item);
                            continue;
                        }

                        if (!productStats[productId]) {
                            productStats[productId] = { quantity: 0, revenue: 0 };
                        }
                        productStats[productId].quantity += quantity;
                        productStats[productId].revenue += quantity * price;
                    }
                } catch (e) {
                    console.error("Lỗi khi parsing JSON của đơn hàng:", order.id, e);
                }
            } else if (order.tool_id && order.total_amount) { // Đơn hàng cũ (dựa vào tool_id và total_amount)
                 const productId = order.tool_id;
                 const revenue = parseFloat(order.total_amount);
                 const quantity = order.quantity || 1; // Assume quantity is 1 if not present (or derive if possible)

                 if (isNaN(revenue) || revenue < 0) {
                     console.warn("Skipping old order with invalid total_amount:", order.id);
                     continue;
                 }

                 if (!productStats[productId]) {
                    productStats[productId] = { quantity: 0, revenue: 0 };
                 }
                 productStats[productId].quantity += quantity; // Add quantity (might be inaccurate for old orders if not stored)
                 productStats[productId].revenue += revenue;
            } else {
                 console.warn("Skipping order with insufficient data:", order.id);
            }
        }

        // Chuyển đổi object productStats thành mảng và lấy tên sản phẩm
        const productIds = Object.keys(productStats).map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0); // Ensure IDs are valid numbers
        if (productIds.length === 0) {
            return res.json([]); // Trả về mảng rỗng nếu không có dữ liệu
        }

        // Use parameterized query for safety
        const productDetails = await pool.query(
            `SELECT id, name FROM kitchen_tools WHERE id = ANY($1::int[])`,
            [productIds]
        );


        const productNameMap = {};
        productDetails.rows.forEach(p => {
            productNameMap[p.id] = p.name;
        });

        const result = productIds.map(id => ({
            id: id,
            name: productNameMap[id] || `Dụng cụ ID ${id}`, // Fallback name
            quantity_sold: productStats[id].quantity,
            total_revenue: productStats[id].revenue
        })).sort((a, b) => b.total_revenue - a.total_revenue); // Sắp xếp theo doanh thu giảm dần

        res.json(result);

    } catch (err) {
        console.error("Lỗi khi lấy thống kê doanh thu dụng cụ:", err.message);
        res.status(500).send('Lỗi server');
    }
};