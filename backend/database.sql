-- database.sql

-- Tạo ENUM types để giới hạn giá trị cho một số cột
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE course_level AS ENUM ('cơ bản', 'nâng cao', 'chuyên nghiệp');

-- Bảng users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    level course_level,
    cuisine VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    instructor_id INT NOT NULL,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- Bảng lessons
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(255),
    content TEXT,
    course_id INT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Bảng enrollments (bảng nối nhiều-nhiều giữa users và courses)
-- Bảng enrollments (đã cập nhật)
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY, -- Thêm cột ID để định danh duy nhất mỗi đơn hàng
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'cho xac nhan', -- Các trạng thái: cho xac nhan, da xac nhan, da huy
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Bảng mới để lưu lịch sử thanh toán
CREATE TABLE payment_history (
    id SERIAL PRIMARY KEY,
    enrollment_id INT NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(100),
    status VARCHAR(50),
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
);
-- Bảng q_and_a
CREATE TABLE q_and_a (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT,
    user_id INT NOT NULL,
    lesson_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);