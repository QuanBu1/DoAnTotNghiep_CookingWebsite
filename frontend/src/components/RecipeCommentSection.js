// src/components/RecipeCommentSection.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { Card, Form, Button, Badge, Alert, Spinner, Stack } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';

const RecipeCommentSection = ({ recipeId }) => {
    const { user, token } = useContext(AuthContext);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchComments = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`/api/user-recipes/${recipeId}/comments`, config);
            setComments(res.data);
        } catch (err) {
            setError('Không thể tải bình luận.');
        } finally {
            setLoading(false);
        }
    }, [token, recipeId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("Vui lòng đăng nhập để bình luận.");
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`/api/user-recipes/${recipeId}/comments`, { comment: newComment }, config);
            setNewComment('');
            fetchComments(); // Tải lại danh sách bình luận sau khi gửi
        } catch (err) {
            setError(err.response?.data?.msg || 'Gửi bình luận thất bại.');
        }
    };

    return (
        <Card className="mt-4">
            <Card.Header as="h4">Bình luận</Card.Header>
            <Card.Body>
                {/* Form để đăng bình luận mới */}
                <Form onSubmit={handleCommentSubmit} className="mb-4">
                    <Form.Group>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={user ? `${user.full_name}, hãy để lại bình luận...` : "Đăng nhập để bình luận..."}
                            required
                            disabled={!user}
                        />
                    </Form.Group>
                    <Button type="submit" variant="primary" className="mt-2" disabled={!user}>
                        Gửi bình luận
                    </Button>
                </Form>

                {error && <Alert variant="danger">{error}</Alert>}
                
                {/* Hiển thị danh sách các bình luận */}
                {loading ? (
                    <div className="text-center"><Spinner animation="border" /></div>
                ) : (
                    <Stack gap={3}>
                        {comments.length > 0 ? comments.map(comment => (
                            <div key={comment.id} className="d-flex">
                                <div className="flex-shrink-0 me-3">
                                    {/* Có thể thêm avatar ở đây */}
                                </div>
                                <div className="flex-grow-1">
                                    <strong>{comment.user_name}</strong>
                                    {['instructor', 'admin'].includes(comment.user_role) && (
                                        <Badge bg="success" className="ms-2">{comment.user_role}</Badge>
                                    )}
                                    <p className="mb-1">{comment.comment_text}</p>
                                    <small className="text-muted">
                                        {new Date(comment.created_at).toLocaleString('vi-VN')}
                                    </small>
                                </div>
                            </div>
                        )) : (
                            <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                        )}
                    </Stack>
                )}
            </Card.Body>
        </Card>
    );
};

export default RecipeCommentSection;