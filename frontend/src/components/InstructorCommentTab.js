// src/components/InstructorCommentTab.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Table, Alert, Spinner, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const InstructorCommentTab = () => {
    const { token } = useContext(AuthContext);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('/api/instructor/comments', config);
            setComments(res.data);
        } catch (err) {
            setError('Không thể tải danh sách bình luận.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    if (loading) return <div className="text-center p-4"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Alert variant="info">
                Hiển thị 50 bình luận và câu hỏi mới nhất từ học viên trong các khóa học của bạn.
            </Alert>
            {comments.length === 0 ? (
                <Alert variant="secondary">Chưa có bình luận nào từ học viên.</Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Loại</th>
                            <th>Nội dung</th>
                            <th>Học viên</th>
                            <th>Bài học</th>
                            <th>Ngày gửi</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comments.map(comment => (
                            <tr key={`${comment.type}-${comment.id}`}>
                                <td>
                                    {comment.type === 'thread'
                                        ? <Badge bg="primary">Câu hỏi</Badge>
                                        : <Badge bg="secondary">Trả lời</Badge>
                                    }
                                </td>
                                <td style={{ minWidth: '250px' }}>{comment.text}</td>
                                <td>{comment.author}</td>
                                <td>{comment.lesson_title}</td>
                                <td>{new Date(comment.created_at).toLocaleString('vi-VN')}</td>
                                <td>
                                    <Button
                                        as={Link}
                                        to={`/courses/${comment.course_id}/lessons/${comment.lesson_id}`}
                                        variant="outline-primary"
                                        size="sm"
                                    >
                                        Xem & Trả lời
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </>
    );
};

export default InstructorCommentTab;