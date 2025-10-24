// controllers/courses.js

const pool = require('../db');

// Lấy tất cả khóa học
exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await pool.query("SELECT c.*, u.full_name AS instructor_name FROM courses c JOIN users u ON c.instructor_id = u.id ORDER BY c.id DESC");
        res.json(allCourses.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

// Lấy một khóa học theo ID
exports.getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await pool.query("SELECT c.*, u.full_name AS instructor_name FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = $1", [id]);
        if (course.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy khóa học" });
        }
        res.json(course.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

// Tạo khóa học mới (cũng được cập nhật để nhận cooking_style)
exports.createCourse = async (req, res) => {
    const { title, description, level, cuisine, cooking_style, price, image_url } = req.body;
    const instructorId = req.user.id;
    try {
        const newCourse = await pool.query(
            "INSERT INTO courses (title, description, level, cuisine, cooking_style, price, image_url, instructor_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *", 
            [title, description, level, cuisine, cooking_style, price, image_url, instructorId]
        );
        res.status(201).json(newCourse.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

// === PHẦN SỬA LỖI QUAN TRỌNG NẰM Ở ĐÂY ===
// Cập nhật khóa học
exports.updateCourse = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { courseId } = req.params;
        const { title, description, level, cuisine, cooking_style, price, image_url, live_embed_url } = req.body;

        // Lấy trạng thái cũ của live_embed_url
        const oldCourse = await client.query("SELECT live_embed_url, title FROM courses WHERE id = $1", [courseId]);
        const oldLink = oldCourse.rows[0]?.live_embed_url;
        const courseTitle = oldCourse.rows[0]?.title;

        const updatedCourseResult = await client.query(
            "UPDATE courses SET title = $1, description = $2, level = $3, cuisine = $4, cooking_style = $5, price = $6, image_url = $7, live_embed_url = $8 WHERE id = $9 RETURNING *", 
            [title, description, level, cuisine, cooking_style, price, image_url, live_embed_url, courseId]
        );

        // --- PHẦN TẠO THÔNG BÁO ---
        // Chỉ tạo thông báo khi link live được THÊM MỚI (từ rỗng -> có nội dung)
        if (!oldLink && live_embed_url) {
            const sendNotification = req.app.get('sendNotification');

            // 1. Tìm tất cả học viên đã ghi danh
            const enrolledUsers = await client.query(
                "SELECT user_id FROM enrollments WHERE course_id = $1 AND status = 'da xac nhan'",
                [courseId]
            );

            // 2. Tạo thông báo cho mỗi học viên
            for (const user of enrolledUsers.rows) {
                const message = `Khóa học "${courseTitle}" sắp có livestream!`;
                const link = `/courses/${courseId}`;
                const newNotifResult = await client.query(
                    "INSERT INTO notifications (user_id, message, link) VALUES ($1, $2, $3) RETURNING *",
                    [user.user_id, message, link]
                );
                // 3. Gửi thông báo real-time
                sendNotification(user.user_id, newNotifResult.rows[0]);
            }
        }
        // --- KẾT THÚC PHẦN TẠO THÔNG BÁO ---

        await client.query('COMMIT');
        res.json(updatedCourseResult.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Lỗi server');
    } finally {
        client.release();
    }
};

// Xóa khóa học
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const deleteResult = await pool.query("DELETE FROM courses WHERE id = $1 RETURNING *", [courseId]);
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ msg: "Không tìm thấy khóa học để xóa." });
        }
        res.json({ msg: "Khóa học đã được xóa thành công." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

// ... (Các hàm còn lại không thay đổi)
exports.getLessonsForCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        let lessons;
        const userId = req.user?.id;
        if (userId) {
            const lessonsResult = await pool.query(
                `SELECT l.*, lc.user_id IS NOT NULL AS completed
                 FROM lessons l
                 LEFT JOIN lesson_completions lc ON l.id = lc.lesson_id AND lc.user_id = $1
                 WHERE l.course_id = $2
                 ORDER BY l.id ASC`,
                [userId, courseId]
            );
            lessons = lessonsResult.rows;
        } else {
            const lessonsResult = await pool.query(
                "SELECT *, false AS completed FROM lessons WHERE course_id = $1 ORDER BY id ASC",
                [courseId]
            );
            lessons = lessonsResult.rows;
        }
        res.json(lessons);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

exports.addLessonToCourse = async (req, res) => {
    const { title, video_url, content, image_urls } = req.body;
    const { courseId } = req.params;
    if (!title || !content) {
        return res.status(400).json({ msg: "Vui lòng nhập tiêu đề và nội dung bài học" });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const newLessonResult = await client.query("INSERT INTO lessons (title, video_url, content, course_id) VALUES ($1, $2, $3, $4) RETURNING *", [title, video_url, content, courseId]);
        const newLesson = newLessonResult.rows[0];
        if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
            for (const imageUrl of image_urls) {
                if (imageUrl.trim() !== '') {
                    await client.query("INSERT INTO lesson_images (image_url, lesson_id) VALUES ($1, $2)", [imageUrl.trim(), newLesson.id]);
                }
            }
        }
        await client.query('COMMIT');
        res.status(201).json(newLesson);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Lỗi server');
    } finally {
        client.release();
    }
};

exports.enrollInCourse = async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (req.user.role === 'admin') {
        return res.status(403).json({ msg: "Admin không thể ghi danh vào khóa học." });
    }

    try {
        const courseQuery = await pool.query("SELECT price FROM courses WHERE id = $1", [courseId]);
        if (courseQuery.rows.length === 0) {
            return res.status(404).json({ msg: "Không tìm thấy khóa học." });
        }
        const coursePrice = parseFloat(courseQuery.rows[0].price);

        const successfulEnrollment = await pool.query(
            "SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = 'da xac nhan'",
            [userId, courseId]
        );
        if (successfulEnrollment.rows.length > 0) {
            return res.status(400).json({ msg: "Bạn đã ghi danh vào khóa học này rồi." });
        }

        if (coursePrice <= 0) {
            const newEnrollment = await pool.query(
                "INSERT INTO enrollments (user_id, course_id, status) VALUES ($1, $2, 'da xac nhan') RETURNING id",
                [userId, courseId]
            );
            return res.status(200).json({
                isFree: true,
                message: "Ghi danh vào khóa học miễn phí thành công!",
                enrollmentId: newEnrollment.rows[0].id
            });
        } else {
            const pendingEnrollment = await pool.query(
                "SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = 'cho xac nhan'",
                [userId, courseId]
            );
            if (pendingEnrollment.rows.length > 0) {
                return res.status(200).json({
                    isFree: false,
                    message: "Bạn đã có một đơn hàng đang chờ thanh toán cho khóa học này.",
                    enrollmentId: pendingEnrollment.rows[0].id
                });
            }

            const newOrder = await pool.query(
                "INSERT INTO enrollments (user_id, course_id, status) VALUES ($1, $2, 'cho xac nhan') RETURNING id",
                [userId, courseId]
            );
            
            return res.status(201).json({ 
                isFree: false,
                message: "Đã tạo đơn hàng, vui lòng thanh toán.",
                enrollmentId: newOrder.rows[0].id 
            });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

exports.getEnrollmentStatus = async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    try {
        const enrollment = await pool.query(
            "SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = 'da xac nhan'", 
            [userId, courseId]
        );
        res.json({ isEnrolled: enrollment.rows.length > 0 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

exports.toggleFavorite = async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    try {
        const existingFavorite = await pool.query(
            "SELECT * FROM favorite_courses WHERE user_id = $1 AND course_id = $2",
            [userId, courseId]
        );
        if (existingFavorite.rows.length > 0) {
            await pool.query(
                "DELETE FROM favorite_courses WHERE user_id = $1 AND course_id = $2",
                [userId, courseId]
            );
            res.json({ isFavorited: false, msg: "Đã bỏ khóa học khỏi danh sách yêu thích." });
        } else {
            await pool.query(
                "INSERT INTO favorite_courses (user_id, course_id) VALUES ($1, $2)",
                [userId, courseId]
            );
            res.json({ isFavorited: true, msg: "Đã thêm khóa học vào danh sách yêu thích." });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

exports.getFavoriteStatus = async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    try {
        const favorite = await pool.query(
            "SELECT * FROM favorite_courses WHERE user_id = $1 AND course_id = $2",
            [userId, courseId]
        );
        res.json({ isFavorited: favorite.rows.length > 0 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Lỗi server');
    }
};

exports.searchCourses = async (req, res) => {
    try {
        const { q } = req.query; 

        if (!q) {
            return res.json([]);
        }

        const searchResult = await pool.query(
            "SELECT c.*, u.full_name AS instructor_name FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.title ILIKE $1 ORDER BY c.id DESC",
            [`%${q}%`]
        );

        res.json(searchResult.rows);
    } catch (err) {
        console.error("Lỗi khi tìm kiếm khóa học:", err.message);
        res.status(500).send('Lỗi server');
    }
};