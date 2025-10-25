// src/components/CommentManagementTab.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, Badge, Form, InputGroup, Row, Col, Spinner } from 'react-bootstrap'; // Thêm imports
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import AdminPagination from './AdminPagination'; // Import

const CommentManagementTab = () => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    // State cho tìm kiếm, lọc, phân trang
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'thread', 'reply'
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(10);

    const fetchComments = useCallback(async (page = 1, search = searchTerm, filter = filterType) => {
        setLoading(true);
        try {
            setError('');
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page,
                    limit,
                    search: search.trim(),
                    filter // filter là type
                }
            };
            const res = await axios.get('/api/admin/comments', config); // API đã cập nhật
            setComments(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
            setCurrentPage(res.data.pagination.currentPage);
            setTotalItems(res.data.pagination.totalItems);
        } catch (err) {
            setError('Không thể tải danh sách bình luận.');
            setComments([]);
            setTotalPages(1);
            setCurrentPage(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [token, limit, searchTerm, filterType]);

    useEffect(() => {
        if (token) {
            fetchComments(currentPage, searchTerm, filterType);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, currentPage, filterType]); // Fetch khi token, trang, hoặc bộ lọc thay đổi

    // Handlers tương tự
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchComments(1, searchTerm, filterType);
    };

    const handleFilterChange = (e) => {
        setFilterType(e.target.value);
        setCurrentPage(1);
    };

     const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Hàm xóa giữ nguyên
    const handleDelete = async (type, id) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa bình luận (${type}) ID: ${id}?`)) {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`/api/admin/comments/${type}/${id}`, config);
                fetchComments(currentPage, searchTerm, filterType); // Tải lại trang hiện tại
            } catch (err) {
                setError(err.response?.data?.msg || 'Xóa bình luận thất bại.');
            }
        }
    };

    return (
        <>
            {/* Thanh công cụ */}
            <Row className="mb-3 g-2 align-items-center">
                 {/* Bộ lọc theo Loại */}
                <Col md={3}>
                    <Form.Group controlId="commentFilterType">
                        <Form.Select value={filterType} onChange={handleFilterChange}>
                            <option value="all">Tất cả loại</option>
                            <option value="thread">Câu hỏi</option>
                            <option value="reply">Trả lời</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
                 {/* Tìm kiếm */}
                <Col>
                     <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Tìm theo nội dung hoặc tác giả..."
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            onKeyPress={handleSearchKeyPress}
                        />
                        <Button variant="outline-secondary" onClick={handleSearch}>
                             <i className="bi bi-search"></i> Tìm
                        </Button>
                    </InputGroup>
                </Col>
            </Row>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

             {/* Thông tin tổng số và loading */}
             <div className="d-flex justify-content-between align-items-center mb-2">
                 <small className="text-muted">Hiển thị {comments.length} trên tổng số {totalItems} bình luận</small>
                 {loading && <Spinner animation="border" size="sm" />}
            </div>

            {/* Bảng dữ liệu */}
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Loại</th>
                        <th style={{ minWidth: '300px' }}>Nội dung</th>
                        <th>Tác giả</th>
                        <th>Ngày tạo</th>
                        <th>Bài học</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {!loading && comments.map(comment => (
                        <tr key={`${comment.type}-${comment.id}`}>
                            <td>{comment.id}</td>
                            <td>
                                {comment.type === 'thread'
                                    ? <Badge bg="primary">Câu hỏi</Badge>
                                    : <Badge bg="secondary">Trả lời</Badge>
                                }
                            </td>
                            {/* Giữ lại style để nội dung dài không bị vỡ layout */}
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
                                    title="Xóa"
                                >
                                   <i className="bi bi-trash-fill"></i>
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {loading && (
                        <tr>
                            <td colSpan="7" className="text-center">
                                <Spinner animation="border" size="sm" /> Đang tải...
                            </td>
                        </tr>
                     )}
                     {!loading && comments.length === 0 && (
                        <tr>
                            <td colSpan="7" className="text-center text-muted">Không tìm thấy bình luận nào.</td>
                        </tr>
                     )}
                </tbody>
            </Table>

            {/* Phân trang */}
             <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </>
    );
};

export default CommentManagementTab;