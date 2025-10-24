// controllers/auth.js
const pool = require('../db'); // Import kết nối database
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
exports.register = async (req, res) => {
    const { fullName, email, password } = req.body;

    // Kiểm tra xem dữ liệu có được gửi đủ không
    if (!fullName || !email || !password) {
        return res.status(400).json({ msg: 'Vui lòng nhập đầy đủ thông tin' });
    }

    try {
        // 1. Kiểm tra xem email đã tồn tại chưa
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (user.rows.length > 0) {
            return res.status(401).json({ msg: "Email đã được sử dụng!" });
        }

        // 2. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        // 3. Thêm người dùng mới vào database
        const newUser = await pool.query(
            "INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, full_name, role",
            [fullName, email, bcryptPassword]
        );

        // Tạm thời chưa tạo token, sẽ làm ở bước sau
        res.status(201).json({
            msg: "Đăng ký thành công!",
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Lỗi server");
    }
};
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Tìm người dùng trong database bằng email
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        // Nếu không tìm thấy người dùng
        if (user.rows.length === 0) {
            return res.status(401).json({ msg: "Email hoặc mật khẩu không đúng!" });
        }

        // 2. So sánh mật khẩu người dùng nhập với mật khẩu đã mã hóa trong DB
        const validPassword = await bcrypt.compare(
            password,
            user.rows[0].password_hash
        );

        // Nếu mật khẩu không khớp
        if (!validPassword) {
            return res.status(401).json({ msg: "Email hoặc mật khẩu không đúng!" });
        }

        // 3. Nếu mọi thứ đều đúng -> Tạo JWT Token
        // Token này sẽ chứa id và vai trò của người dùng
        const payload = {
            user: {
                id: user.rows[0].id,
                role: user.rows[0].role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }, // Token có hạn trong 1 giờ
            (err, token) => {
                if (err) throw err;
                res.json({ token }); // Gửi token về cho client
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Lỗi server");
    }
};