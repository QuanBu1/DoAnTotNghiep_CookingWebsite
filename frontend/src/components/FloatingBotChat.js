// src/components/FloatingBotChat.js
import React, { useState, useContext, useRef, useEffect } from 'react';
import { Button, InputGroup, Form, Spinner, Badge } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import './FloatingBotChat.css';
import axios from 'axios'; // <-- THÊM AXIOS
import { toast } from 'react-toastify'; // <-- THÊM TOAST

const AI_NAME = "Chef Quân AI";

// GỢI Ý (Giữ lại)
const SUGGESTION_CHIPS = [
  'Công thức Carbonara',
  'Mirepoix là gì?',
  '200C sang F?',
  'Tôi có trứng, mì',
  'Bí quyết xào giòn',
  'Lịch sử món Phở' // <-- Thêm câu hỏi mà bot cũ không thể trả lời
];

const FloatingBotChat = ({ courseId }) => {
  const { user, token } = useContext(AuthContext); // <-- Lấy TOKEN
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Chào khi mở lần đầu
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        sender: 'bot',
        content:
          `Xin chào ${user?.full_name || 'bạn'}, tôi là ${AI_NAME}! 👨‍🍳\n` +
          `Hỏi tôi bất cứ điều gì về ẩm thực!`,
        time: new Date().toLocaleTimeString('vi-VN')
      }]);
    }
  }, [isOpen, messages.length, user]);

  // Hàm đẩy tin nhắn của Bot vào chat
  const pushBot = (text) => setMessages(prev => [...prev, {
    id: Date.now() + Math.random(),
    sender: 'bot',
    content: text,
    time: new Date().toLocaleTimeString('vi-VN')
  }]);

  // Hàm xử lý khi bấm chip gợi ý
  const handleChip = (text) => {
    if (isTyping) return;
    setInput(text);
    setTimeout(() => {
      handleSend({ preventDefault: () => {} });
    }, 10);
  };
  
  // === HÀM GỬI TIN NHẮN (ĐÃ THAY THẾ HOÀN TOÀN) ===
  const handleSend = async (e) => {
    e.preventDefault();
    const trimInput = input.trim();
    if (!trimInput || isTyping || !token) {
        if(!token) toast.error("Vui lòng đăng nhập để chat với AI.");
        return;
    }

    // 1. Thêm tin nhắn của User vào giao diện
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: trimInput,
      time: new Date().toLocaleTimeString('vi-VN')
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true); // Bật trạng thái "AI đang gõ"

    // 2. GỌI API BACKEND (ĐÃ KẾT NỐI AI)
    try {
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };
        const body = { prompt: trimInput };
        
        // Gọi đến endpoint /api/ai/chat mà chúng ta vừa tạo
        const res = await axios.post('/api/ai/chat', body, config);

        // 3. Thêm câu trả lời của AI vào giao diện
        pushBot(res.data.response);

    } catch (err) {
        // 4. Xử lý lỗi
        const errorMsg = err.response?.data?.msg || "Có lỗi xảy ra, tôi không thể trả lời lúc này 😵‍💫";
        pushBot(errorMsg);
        toast.error(errorMsg);
    } finally {
        setIsTyping(false); // Tắt trạng thái "AI đang gõ"
    }
  };
  // === KẾT THÚC HÀM GỬI TIN NHẮN MỚI ===


  // Component Message (đã sửa lỗi CSS từ lần trước)
  const Message = ({ msg }) => (
    <div className={`chat-message ${msg.sender}`}>
        <div className="chat-avatar">
            {msg.sender === 'bot' ? 'AI' : (user?.full_name?.substring(0, 1) || 'B')}
        </div>
        <div className='message-content'>
            {msg.sender === 'bot' && <Badge bg="success" className="me-2">{AI_NAME}</Badge>}
            <pre style={{whiteSpace:'pre-wrap', margin:0, fontFamily: 'inherit'}}>
                {msg.content}
            </pre>
            <span className='time'>{msg.time}</span>
        </div>
    </div>
  );


  return (
    <>
      <Button className="floating-chat-icon" variant="primary" onClick={() => setIsOpen(!isOpen)}>
        <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-chat-dots-fill'}`}></i>
      </Button>

      <div className={`chat-window-bot ${isOpen ? 'open' : ''}`}>
        <div className="chat-header-bot d-flex justify-content-between align-items-center">
          <div>
            <p className="m-0">{AI_NAME}</p>
            <small style={{color: 'rgba(255, 255, 255, 0.8)'}}>
                Trợ lý Ẩm thực Thông minh
            </small>
          </div>
        </div>
        
        <div className="chat-suggestion-bar">
            {SUGGESTION_CHIPS.map((c,i)=>(
              <Button key={i} size="sm" variant="outline-primary" className="suggestion-chip" onClick={()=>handleChip(c)}>
                {c}
              </Button>
            ))}
        </div>

        <div className="chat-body-bot">
          {messages.map(msg => <Message key={msg.id} msg={msg} />)}
          {isTyping && <div className="typing-indicator">Chef Quân AI đang trả lời... <Spinner animation="grow" size="sm" /></div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-footer-bot">
          <Form onSubmit={handleSend}>
            <InputGroup>
              <Form.Control
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isTyping ? "Đang chờ phản hồi..." : "Hỏi tôi bất cứ điều gì về ẩm thực..."}
                disabled={isTyping || !user}
                onKeyPress={(e) => { e.key === 'Enter' && handleSend(e); }}
              />
              <Button variant="primary" type="submit" disabled={isTyping || !user}>
                <i className="bi bi-send-fill"></i>
              </Button>
            </InputGroup>
            {!user && <small className="text-danger">Vui lòng đăng nhập để sử dụng AI Chatbot.</small>}
          </Form>
        </div>
      </div>
    </>
  );
};

export default FloatingBotChat;