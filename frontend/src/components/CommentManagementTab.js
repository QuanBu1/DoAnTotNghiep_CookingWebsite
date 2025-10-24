// src/components/CommentManagementTab.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const CommentManagementTab = () => {
    const [comments, setComments] = useState([]);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    const fetchComments = useCallback(async () => {
        try {
            setError('');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('/api/admin/comments', config);
            setComments(res.data);
        } catch (err) {
            setError('Không thể tải danh sách bình luận.');
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchComments();
        }
    }, [token, fetchComments]);

    const handleDelete = async (type, id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`/api/admin/comments/${type}/${id}`, config);
                fetchComments(); // Tải lại danh sách sau khi xóa
            } catch (err) {
                setError(err.response?.data?.msg || 'Xóa bình luận thất bại.');
            }
        }
    };

    return (
        <>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Loại</th>
                        <th>Nội dung</th>
                        <th>Tác giả</th>
                        <th>Ngày tạo</th>
                        <th>Bài học</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {comments.map(comment => (
                        <tr key={`${comment.type}-${comment.id}`}>
                            <td>{comment.id}</td>
                            <td>
                                {comment.type === 'thread' 
                                    ? <Badge bg="primary">Câu hỏi</Badge> 
                                    : <Badge bg="secondary">Trả lời</Badge>
                                }
                            </td>
                            <td style={{ maxWidth: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{comment.text}</td>
                            <td>{comment.author}</td>
                            <td>{new Date(comment.created_at).toLocaleString('vi-VN')}</td>
                            <td>
                                <Link to={`/courses/${comment.course_id}`}>
                                    {comment.lesson_title}
                                </Link>
                            </td>
                            <td>
                                <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => handleDelete(comment.type, comment.id)}
                                >
                                    Xóa
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
};

export default CommentManagementTab;