// src/components/QandASection.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { Card, Form, Button, Badge, Alert, Spinner, Stack } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';

// Component con để hiển thị một bình luận/trả lời
const Reply = ({ reply }) => (
    <div className="d-flex mt-3">
        <div className="flex-shrink-0 me-2">
            {/* Có thể thêm avatar ở đây sau */}
        </div>
        <div className="flex-grow-1">
            <div className="bg-light rounded p-2">
                <strong>{reply.user_name}</strong>
                {['instructor', 'admin'].includes(reply.user_role) && <Badge bg="success" className="ms-2">{reply.user_role}</Badge>}
                <p className="mb-0 small">{reply.reply_text}</p>
            </div>
            <small className="text-muted ms-2">{new Date(reply.created_at).toLocaleString('vi-VN')}</small>
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
        <Form onSubmit={handleSubmit} className="d-flex mt-2">
            <Form.Control 
                size="sm"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Viết bình luận..."
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
        <Card className="mt-4">
            <Card.Header as="h4">Bình luận</Card.Header>
            <Card.Body>
                <Form onSubmit={handleQuestionSubmit} className="mb-4">
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
                    <Button type="submit" variant="primary" className="mt-2">Gửi bình luận</Button>
                </Form>
                {error && <Alert variant="danger">{error}</Alert>}
                {loading ? <div className="text-center"><Spinner animation="border" /></div> : (
                    <Stack gap={4}>
                        {threads.length > 0 ? threads.map(thread => (
                            <div key={thread.id}>
                                {/* Câu hỏi gốc */}
                                <div className="d-flex">
                                    <div className="flex-grow-1">
                                        <strong>{thread.user_name}</strong>
                                        {['instructor', 'admin'].includes(thread.user_role) && <Badge bg="info" className="ms-2">{thread.user_role}</Badge>}
                                        <p>{thread.question_text}</p>
                                        <div className="d-flex align-items-center">
                                            <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => handleLikeClick(thread.id)}>
                                                {thread.user_has_liked ? <b>Thích</b> : 'Thích'}
                                            </Button>
                                            <span className="text-muted mx-2">·</span>
                                            <small className="text-muted">{new Date(thread.created_at).toLocaleString('vi-VN')}</small>
                                        </div>
                                        {thread.like_count > 0 && <div className="mt-1 text-muted small"><i className="bi bi-hand-thumbs-up-fill"></i> {thread.like_count}</div>}
                                    </div>
                                </div>
                                
                                {/* Các câu trả lời */}
                                <div className="ps-5">
                                    {thread.replies.map(reply => <Reply key={reply.id} reply={reply} />)}
                                    <ReplyForm threadId={thread.id} courseId={courseId} fetchThreads={fetchThreads} />
                                </div>
                            </div>
                        )) : <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>}
                    </Stack>
                )}
            </Card.Body>
        </Card>
    );
};

export default QandASection;