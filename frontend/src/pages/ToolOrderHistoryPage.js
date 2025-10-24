// src/pages/ToolOrderHistoryPage.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const ToolOrderHistoryPage = () => {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchOrderHistory = useCallback(async () => {
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // GỌI API LẤY LỊCH SỬ ĐƠN HÀNG
            const res = await axios.get('/api/orders/tools/history', config); 
            setOrders(res.data);
        } catch (err) {
            setError('Không thể tải lịch sử mua hàng.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrderHistory();
    }, [fetchOrderHistory]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
            case 'pending_selection': return <Badge bg="warning">Chờ xử lý</Badge>;
            case 'confirmed': return <Badge bg="info">Đã xác nhận</Badge>;
            case 'shipped': return <Badge bg="primary">Đang giao</Badge>;
            case 'completed': return <Badge bg="success">Hoàn thành</Badge>;
            case 'cancelled': return <Badge bg="danger">Đã hủy</Badge>;
            default: return <Badge bg="secondary">Không rõ</Badge>;
        }
    };

    return (
        <Container className="my-5">
            <Row className="justify-content-center">
                <Col lg={12}>
                        <h2 className="mb-4">Lịch sử Đơn hàng Dụng cụ</h2>
                        {loading ? (
                            <div className="text-center"><Spinner animation="border" /></div>
                        ) : error ? (
                            <Alert variant="danger">{error}</Alert>
                        ) : orders.length === 0 ? (
                            <Alert variant="info">Bạn chưa có đơn hàng nào.</Alert>
                        ) : (
                            <Card className="shadow-sm">
                                <Table striped bordered hover responsive className="mb-0">
                                    <thead>
                                        <tr>
                                            <th>Mã Đơn hàng</th>
                                            <th>Sản phẩm</th>
                                            <th>Tổng tiền</th>
                                            <th>PT Thanh toán</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày tạo</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => (
                                            <tr key={order.id}>
                                                <td>#{order.id}</td>
                                                <td>{order.tool_name}</td>
                                                <td>{new Intl.NumberFormat('vi-VN').format(order.total_amount)} VND</td>
                                                <td>{order.payment_method === 'cod' ? 'COD (Tiền mặt)' : order.payment_method === 'bank_transfer' ? 'Chuyển khoản' : 'Chưa chọn'}</td>
                                                <td>{getStatusBadge(order.status)}</td>
                                                <td>{new Date(order.created_at).toLocaleString('vi-VN')}</td>
                                                <td>
                                                    <Button 
                                                        variant="outline-info" 
                                                        size="sm"
                                                        onClick={() => navigate(`/tool-checkout/${order.id}`)}
                                                        >
                                                        Xem chi tiết
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card>
                        )}
                </Col>
            </Row>
        </Container>
    );
};

export default ToolOrderHistoryPage;