// src/components/MessageManagementTab.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Table, Alert, Spinner, Badge, Button, Form, InputGroup, Row, Col } from 'react-bootstrap'; // Thêm imports
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import ReplyMessageModal from './ReplyMessageModal';
import AdminPagination from './AdminPagination'; // Import

// Danh sách trạng thái để lọc
const messageStatuses = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'new', label: 'Mới (Chưa đọc)' },
    { value: 'read', label: 'Đã đọc (Chưa trả lời)' },
    { value: 'replied', label: 'Đã trả lời' }
];

const MessageManagementTab = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    // State cho modal (giữ nguyên)
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState(null);

    // State cho tìm kiếm, lọc, phân trang
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // Giá trị mặc định cho bộ lọc status
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(10);

    const fetchMessages = useCallback(async (page = 1, search = searchTerm, filter = filterStatus) => {
        setLoading(true);
        try {
            setError('');
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page,
                    limit,
                    search: search.trim(),
                    filter // filter là status: all, new, read, replied
                }
            };
            const res = await axios.get('/api/admin/messages', config); // API đã cập nhật
            setMessages(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
            setCurrentPage(res.data.pagination.currentPage);
            setTotalItems(res.data.pagination.totalItems);
        } catch (err) {
            setError('Không thể tải danh sách tin nhắn.');
            setMessages([]);
            setTotalPages(1);
            setCurrentPage(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [token, limit, searchTerm, filterStatus]);

    useEffect(() => {
        if (token) {
            fetchMessages(currentPage, searchTerm, filterStatus);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, currentPage, filterStatus]); // Fetch khi token, trang, hoặc bộ lọc thay đổi

    // Handlers tương tự
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchMessages(1, searchTerm, filterStatus);
    };

    const handleFilterChange = (e) => {
        setFilterStatus(e.target.value);
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

    // Handlers modal giữ nguyên
    const handleOpenReplyModal = (messageId) => {
        setSelectedMessageId(messageId);
        setShowReplyModal(true);
    };

    const handleCloseReplyModal = () => {
        setShowReplyModal(false);
        setSelectedMessageId(null);
    };

    // Hàm lấy badge trạng thái
    const getStatusBadge = (is_read, is_replied) => {
        if (is_replied) return <Badge bg="success">Đã trả lời</Badge>;
        if (is_read) return <Badge bg="secondary">Đã đọc</Badge>;
        return <Badge bg="primary">Mới</Badge>;
    };

    return (
        <>
            {/* Thanh công cụ */}
            <Row className="mb-3 g-2 align-items-center">
                {/* Bộ lọc theo Trạng thái */}
                <Col md={3}>
                    <Form.Group controlId="messageFilterStatus">
                        <Form.Select value={filterStatus} onChange={handleFilterChange}>
                            {messageStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Col>
                 {/* Tìm kiếm */}
                <Col>
                     <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Tìm theo người gửi, email, chủ đề, nội dung..."
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

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Thông tin tổng số và loading */}
             <div className="d-flex justify-content-between align-items-center mb-2">
                 <small className="text-muted">Hiển thị {messages.length} trên tổng số {totalItems} tin nhắn</small>
                 {loading && <Spinner animation="border" size="sm" />}
            </div>

            {/* Bảng dữ liệu */}
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Người gửi</th>
                        <th>Email</th>
                        <th>Chủ đề</th>
                        <th style={{ minWidth: '300px' }}>Nội dung</th>
                        <th>Ngày gửi</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {!loading && messages.map((msg) => (
                        // Đánh dấu dòng chưa đọc bằng class hoặc style
                        <tr key={msg.id} className={!msg.is_read && !msg.is_replied ? 'table-info' : ''}>
                            <td>{msg.sender_name}</td>
                            <td>{msg.sender_email}</td>
                            <td>{msg.subject}</td>
                            {/* Giữ style để nội dung không vỡ layout */}
                            <td style={{ maxWidth: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {msg.message.length > 100 ? `${msg.message.substring(0, 100)}...` : msg.message}
                            </td>
                            <td>{new Date(msg.created_at).toLocaleString('vi-VN')}</td>
                            <td>{getStatusBadge(msg.is_read, msg.is_replied)}</td>
                            <td>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleOpenReplyModal(msg.id)}
                                    title="Phản hồi"
                                >
                                   <i className="bi bi-reply-fill"></i> Phản hồi
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
                     {!loading && messages.length === 0 && (
                        <tr>
                            <td colSpan="7" className="text-center text-muted">Không tìm thấy tin nhắn nào.</td>
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

            {/* Modal phản hồi */}
            <ReplyMessageModal
                show={showReplyModal}
                handleClose={handleCloseReplyModal}
                messageId={selectedMessageId}
                // Tải lại trang hiện tại sau khi phản hồi
                onReplied={() => fetchMessages(currentPage, searchTerm, filterStatus)}
            />
        </>
    );
};

export default MessageManagementTab;