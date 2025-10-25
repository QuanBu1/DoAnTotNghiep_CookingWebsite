// src/components/OrderManagementTab.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Alert, Spinner, Badge, Form, Button, InputGroup, Row, Col } from 'react-bootstrap'; // Thêm imports
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import OrderDetailModal from './OrderDetailModal';
import AdminPagination from './AdminPagination'; // Import

// Danh sách trạng thái đơn hàng dụng cụ để lọc
const toolOrderStatuses = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xử lý (CK)' }, // Gộp pending và pending_selection nếu cần
    { value: 'confirmed', label: 'Đã xác nhận (COD/Đã CK)' },
    { value: 'shipped', label: 'Đang giao' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' }
];
// Danh sách trạng thái để cập nhật (không có 'all')
const updateStatuses = toolOrderStatuses.filter(s => s.value !== 'all');

const OrderManagementTab = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    // State cho modal chi tiết (giữ nguyên)
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // State cho tìm kiếm, lọc, phân trang
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // Giá trị mặc định cho bộ lọc status
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(10);

    const fetchOrders = useCallback(async (page = 1, search = searchTerm, filter = filterStatus) => {
        setLoading(true);
        try {
            setError('');
            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                params: {
                    page,
                    limit,
                    search: search.trim(),
                    filter // filter là status
                }
            };
            const res = await axios.get('/api/admin/orders', config); // API đã cập nhật
            setOrders(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
            setCurrentPage(res.data.pagination.currentPage);
            setTotalItems(res.data.pagination.totalItems);
        } catch (err) {
            setError('Không thể tải danh sách đơn hàng.');
            setOrders([]);
            setTotalPages(1);
            setCurrentPage(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [token, limit, searchTerm, filterStatus]);

    useEffect(() => {
        if (token) {
            fetchOrders(currentPage, searchTerm, filterStatus);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, currentPage, filterStatus]); // Fetch khi token, trang, hoặc bộ lọc thay đổi

    // Handlers tương tự
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchOrders(1, searchTerm, filterStatus);
    };

    const handleFilterChange = (e) => {
        setFilterStatus(e.target.value);
        setCurrentPage(1);
        // fetchOrders sẽ tự gọi lại
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Hàm cập nhật trạng thái giữ nguyên logic toast
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            await axios.put(`/api/admin/orders/${orderId}`, { status: newStatus }, config);
            // Cập nhật lại state local ngay lập tức để UI phản hồi nhanh
            setOrders(prevOrders => prevOrders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
            toast.success("Cập nhật trạng thái thành công!");
            // Không cần fetch lại toàn bộ danh sách ở đây trừ khi cần thiết
        } catch (err) {
            toast.error("Cập nhật trạng thái thất bại.");
            // Cân nhắc fetch lại nếu cập nhật thất bại để đồng bộ state
            // fetchOrders(currentPage, searchTerm, filterStatus);
        }
    };

    // Hàm xem chi tiết giữ nguyên
    const handleShowDetails = async (order) => {
        setDetailLoading(true);
        setShowDetailModal(true);
        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const res = await axios.get(`/api/admin/orders/${order.id}`, config);
            setSelectedOrder(res.data);
        } catch (err) {
            toast.error("Không thể tải chi tiết đơn hàng.");
            setShowDetailModal(false);
        } finally {
            setDetailLoading(false);
        }
    };

    // Hàm lấy badge giữ nguyên
    const getStatusBadge = (status) => {
        // ... (giữ nguyên switch case)
        switch (status) {
            case 'pending':
            case 'pending_selection': return <Badge bg="warning" text="dark">Chờ xử lý</Badge>;
            case 'confirmed': return <Badge bg="info">Đã xác nhận</Badge>;
            case 'shipped': return <Badge bg="primary">Đang giao</Badge>;
            case 'completed': return <Badge bg="success">Hoàn thành</Badge>;
            case 'cancelled': return <Badge bg="danger">Đã hủy</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };


    return (
        <>
            {/* Thanh công cụ */}
            <Row className="mb-3 g-2 align-items-center">
                {/* Bộ lọc theo Trạng thái */}
                <Col md={3}>
                    <Form.Group controlId="orderFilterStatus">
                        <Form.Select value={filterStatus} onChange={handleFilterChange}>
                            {toolOrderStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </Form.Select>
                    </Form.Group>
                </Col>
                 {/* Tìm kiếm */}
                <Col>
                     <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Tìm theo tên KH hoặc tên SP..."
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
                 <small className="text-muted">Hiển thị {orders.length} trên tổng số {totalItems} đơn hàng</small>
                 {loading && <Spinner animation="border" size="sm" />}
            </div>

            {/* Bảng dữ liệu */}
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Mã ĐH</th>
                        <th>Khách hàng</th>
                        <th style={{ minWidth: '250px' }}>Sản phẩm</th>
                        <th>Ngày tạo</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {!loading && orders.map(order => (
                        <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td>{order.customer_name}</td>
                            <td>{order.item_name || 'N/A'}</td> {/* Fallback nếu item_name null */}
                            <td>{new Date(order.created_at).toLocaleString('vi-VN')}</td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td>
                                <div className="d-flex flex-column flex-sm-row gap-2">
                                    <Button variant="outline-info" size="sm" onClick={() => handleShowDetails(order)} title="Xem chi tiết">
                                        <i className="bi bi-eye-fill"></i> Xem
                                    </Button>
                                    <Form.Select
                                        size="sm"
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        style={{ minWidth: '130px' }}
                                        title="Cập nhật trạng thái"
                                    >
                                        {/* Chỉ hiển thị các option có thể cập nhật */}
                                        {updateStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </Form.Select>
                                </div>
                            </td>
                        </tr>
                    ))}
                     {loading && (
                        <tr>
                            <td colSpan="6" className="text-center">
                                <Spinner animation="border" size="sm" /> Đang tải...
                            </td>
                        </tr>
                     )}
                     {!loading && orders.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center text-muted">Không tìm thấy đơn hàng nào.</td>
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

            {/* Modal chi tiết (giữ nguyên) */}
            <OrderDetailModal
                show={showDetailModal}
                handleClose={() => setShowDetailModal(false)}
                order={detailLoading ? null : selectedOrder}
            />
        </>
    );
};

export default OrderManagementTab;
