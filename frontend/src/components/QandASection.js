// src/components/QandASection.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { Card, Form, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import './QandASection.css'; // <-- 1. IMPORT TỆP CSS MỚI

// === 2. THÊM HÀM TẠO AVATAR ===
const getInitials = (name) => {
    if (!name) return 'B';
    const names = name.split(' ');
    const firstName = names[0];
    const lastName = names.length > 1 ? names[names.length - 1] : '';
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
};

// === 3. COMPONENT AVATAR ===
const QAvatar = ({ name, role }) => (
    <div className={`qanda-avatar ${role === 'student' ? 'student' : 'instructor'}`}>
        {getInitials(name)}
    </div>
);

// Component con để hiển thị một bình luận/trả lời
const Reply = ({ reply }) => (
    <div className="qanda-reply">
        <QAvatar name={reply.user_name} role={reply.user_role} />
        <div className="qanda-content">
            <div className="qanda-content-bubble">
                <span className="qanda-author">{reply.user_name}</span>
                {['instructor', 'admin'].includes(reply.user_role) && (
                    <Badge bg="success" className="ms-1">{reply.user_role}</Badge>
                )}
                <p>{reply.reply_text}</p>
            </div>
            <div className="qanda-meta">
                <small>{new Date(reply.created_at).toLocaleString('vi-VN')}</small>
            </div>
        </div>
    </div>
);

// Component con cho form trả lời
const ReplyForm = ({ threadId, courseId, fetchThreads }) => {
    const { token } = useContext(AuthContext);
    const [replyText, setReplyText] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`/api/qanda/${courseId}/${threadId}/reply`, { reply: replyText }, config);
            setReplyText('');
            fetchThreads();
        } catch (err) {
            alert('Gửi trả lời thất bại.');
        }
    };
    
    return (
        <Form onSubmit={handleSubmit} className="qanda-reply-form">
            <Form.Control 
                size="sm"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Viết trả lời..."
                required
            />
            <Button type="submit" variant="primary" size="sm" className="ms-2">Gửi</Button>
        </Form>
    );
};


const QandASection = ({ courseId, lessonId }) => {
    const { user, token } = useContext(AuthContext);
    const [threads, setThreads] = useState([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchThreads = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`/api/qanda/${courseId}/${lessonId}`, config);
            setThreads(res.data);
        } catch (err) {
            setError('Không thể tải bình luận.');
        } finally {
            setLoading(false);
        }
    }, [token, courseId, lessonId]);

    useEffect(() => {
        setLoading(true);
        fetchThreads();
    }, [fetchThreads]);

    const handleQuestionSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`/api/qanda/${courseId}/${lessonId}`, { question: newQuestion }, config);
            setNewQuestion('');
            fetchThreads();
        } catch (err) {
            setError(err.response?.data?.msg || 'Gửi câu hỏi thất bại.');
        }
    };

    const handleLikeClick = async (threadId) => {
        setThreads(threads.map(t => {
            if (t.id === threadId) {
                const newLikeCount = t.user_has_liked ? parseInt(t.like_count) - 1 : parseInt(t.like_count) + 1;
                return { ...t, user_has_liked: !t.user_has_liked, like_count: newLikeCount };
            }
            return t;
        }));
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`/api/qanda/${courseId}/${threadId}/like`, {}, config);
        } catch (err) {
            console.error("Lỗi khi like:", err);
            fetchThreads(); // Rollback if error
        }
    };

    return (
        <Card className="qanda-section-card">
            {/* 4. LOẠI BỎ CARD.HEADER */}
            <Card.Body>
                <Form onSubmit={handleQuestionSubmit} className="mb-4 qanda-post-form">
                    <Form.Group>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder={`${user.full_name}, hãy đặt câu hỏi hoặc bắt đầu một cuộc thảo luận...`}
                            required
                        />
                    </Form.Group>
                    <Button type="submit" variant="primary" className="mt-2">Gửi câu hỏi</Button>
                </Form>
                {error && <Alert variant="danger">{error}</Alert>}
                
                {loading ? <div className="text-center"><Spinner animation="border" /></div> : (
                    <div className="qanda-thread-list">
                        {threads.length > 0 ? threads.map(thread => (
                            <div key={thread.id} className="qanda-thread">
                                {/* Câu hỏi gốc */}
                                <QAvatar name={thread.user_name} role={thread.user_role} />
                                
                                <div className="qanda-content">
                                    <div className="qanda-content-bubble">
                                        <span className="qanda-author">{thread.user_name}</span>
                                        {['instructor', 'admin'].includes(thread.user_role) && (
                                            <Badge bg="info" className="ms-1">{thread.user_role}</Badge>
                                        )}
                                        <p>{thread.question_text}</p>
                                    </div>

                                    <div className="qanda-meta">
                                        <Button 
                                            variant="link" 
                                            size="sm" 
                                            className={thread.user_has_liked ? 'liked' : ''}
                                            onClick={() => handleLikeClick(thread.id)}
                                        >
                                            {thread.user_has_liked ? 'Đã thích' : 'Thích'}
                                        </Button>
                                        <span className="text-muted">·</span>
                                        <small className="text-muted">{new Date(thread.created_at).toLocaleString('vi-VN')}</small>
                                        {thread.like_count > 0 && (
                                            <>
                                                <span className="text-muted">·</span>
                                                <span className="like-count">
                                                    <i className="bi bi-hand-thumbs-up-fill me-1"></i> 
                                                    {thread.like_count}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* Các câu trả lời */}
                                    <div className="qanda-replies">
                                        {thread.replies.map(reply => <Reply key={reply.id} reply={reply} />)}
                                        <ReplyForm threadId={thread.id} courseId={courseId} fetchThreads={fetchThreads} />
                                    </div>
                                </div>
                            </div>
                        )) : <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default QandASection;