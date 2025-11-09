// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require("socket.io");
const pool = require('./db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/qanda', require('./routes/qanda'));
app.use('/api/instructor', require('./routes/instructor'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/user-recipes', require('./routes/userRecipes'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/ai', require('./routes/ai'));

const GLOBAL_NOTIFICATION_ROOM = 'global_notifications';

const userSocketMap = new Map();

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // KHI USER KẾT NỐI, HỌ SẼ GỬI ID CỦA MÌNH ĐỂ ĐĂNG KÝ
    socket.on('register_user', (userId) => {
        if (userId) {
            userSocketMap.set(userId.toString(), socket.id);
            console.log(`User ${userId} registered with socket ${socket.id}`);
        }
    });

    socket.join(GLOBAL_NOTIFICATION_ROOM);

    socket.on("join_lesson_room", (lessonId) => {
        socket.join(lessonId);
        console.log(`User with ID: ${socket.id} joined room: ${lessonId}`);
    });

    socket.on("send_message", (data) => {
        io.to(data.room).emit("receive_message", data);
    });
    
    socket.on("disconnect", () => {
        // Xóa user khỏi map khi họ ngắt kết nối
        for (let [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                break;
            }
        }
        console.log("User Disconnected", socket.id);
    });
});

// === LOGIC GỬI THÔNG BÁO ===

const sendNotification = (userId, notification) => {
    const socketId = userSocketMap.get(userId.toString());
    if (socketId) {
        io.to(socketId).emit('new_notification', notification);
        console.log(`Sent notification to user ${userId} via socket ${socketId}`);
    } else {
        console.log(`Could not find active socket for user ${userId}`);
    }
};

// Helper function để gửi thông báo livestream toàn hệ thống
const sendLiveStreamNotification = (courseData) => {
    const notification = {
        type: 'livestream_scheduled',
        title: 'Livestream Trực Tiếp!',
        message: `Khóa học "${courseData.title}" đang phát trực tiếp. Vào xem ngay!`,
        link: `/courses/${courseData.id}`,
        created_at: new Date().toISOString(),
    };
    
    io.to(GLOBAL_NOTIFICATION_ROOM).emit('new_notification', notification);
};

app.set('sendNotification', sendNotification);

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server đang chạy trên cổng ${PORT}`);
    });
}

// Cần export các hàm và đối tượng để các controller có thể import
module.exports = { sendLiveStreamNotification, io, pool, app };