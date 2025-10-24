// src/components/LiveChat.js

import React, { useEffect, useState, useContext } from 'react';
import io from 'socket.io-client';
import { Form, Button, InputGroup, Badge } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import Picker from 'emoji-picker-react';
import './LiveChat.css';

const socket = io.connect("http://localhost:5000");

function LiveChat({ lessonId }) {
    const { user } = useContext(AuthContext);
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [showPicker, setShowPicker] = useState(false);

    // === HÀM onEmojiClick ĐÃ ĐƯỢC SỬA LẠI CHO CHÍNH XÁC ===
    const onEmojiClick = (emojiObject) => {
        // Thư viện emoji-picker-react (phiên bản mới) truyền trực tiếp object emoji
        // Chúng ta lấy ký tự emoji từ thuộc tính .emoji
        setCurrentMessage(prevInput => prevInput + emojiObject.emoji);
        setShowPicker(false);
    };

    const sendMessage = async () => {
        if (currentMessage.trim() !== "" && user) {
            const messageData = {
                room: lessonId,
                author: user.full_name,
                role: user.role,
                type: 'text',
                content: currentMessage,
                time: new Date(Date.now()).toLocaleTimeString('vi-VN'),
            };
            await socket.emit("send_message", messageData);
            setCurrentMessage("");
        }
    };

    useEffect(() => {
        if (!lessonId) return;

        const receiveMessageHandler = (data) => {
            setMessageList((list) => [...list, data]);
        };
        
        socket.on("receive_message", receiveMessageHandler);
        socket.emit("join_lesson_room", lessonId);

        return () => {
            socket.off("receive_message", receiveMessageHandler);
        };
    }, [lessonId]);

    return (
        <div className="chat-window">
            <div className="chat-header"><p>Thảo luận trực tiếp</p></div>
            <div className="chat-body">
                {messageList.map((msg, index) => (
                    <div
                        key={index}
                        className="message"
                        id={user && user.full_name === msg.author ? "you" : "other"}
                    >
                        <div className="message-content">
                            <p>{msg.content}</p>
                        </div>
                        <div className="message-meta">
                            <span id="author" className="me-2">{msg.author}</span>
                            {['admin', 'instructor'].includes(msg.role) && 
                                <Badge bg="success" className="me-2">{msg.role}</Badge>
                            }
                            <span id="time">{msg.time}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="chat-footer">
                {showPicker && (
                    <div className="emoji-picker-container">
                        {/* Truyền hàm đã sửa vào component Picker */}
                        <Picker onEmojiClick={onEmojiClick} />
                    </div>
                )}
                <InputGroup>
                    <Button variant="light" className="emoji-btn" onClick={() => setShowPicker(!showPicker)}>
                        😊
                    </Button>
                    <Form.Control
                        type="text"
                        value={currentMessage}
                        placeholder="Nhập câu hỏi..."
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => { e.key === "Enter" && sendMessage(); }}
                    />
                    <Button variant="primary" onClick={sendMessage}>Gửi</Button>
                </InputGroup>
            </div>
        </div>
    );
}

export default LiveChat;