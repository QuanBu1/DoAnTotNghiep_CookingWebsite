// src/components/OrderManagementTab.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Alert, Spinner, Badge, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import OrderDetailModal from './OrderDetailModal';

const OrderManagementTab = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            setError('');
            setLoading(true);
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const res = await axios.get('/api/admin/orders', config);
            setOrders(res.data);
        } catch (err) {
            setError('Không thể tải danh sách đơn hàng.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token, fetchOrders]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            // API đã được đơn giản hóa, không cần orderType
            await axios.put(`/api/admin/orders/${orderId}`, { status: newStatus }, config);
            
            setOrders(orders.map(order => 
                order.id === orderId ? { ...order, status: newStatus } : order
            ));

            toast.success("Cập nhật trạng thái thành công!");
        } catch (err) {
            toast.error("Cập nhật trạng thái thất bại.");
        }
    };

    const handleShowDetails = async (order) => {
        setDetailLoading(true);
        setShowDetailModal(true);
        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            // API đã được đơn giản hóa, không cần order.order_type
            const res = await axios.get(`/api/admin/orders/${order.id}`, config);
            setSelectedOrder(res.data);
        } catch (err) {
            toast.error("Không thể tải chi tiết đơn hàng.");
            setShowDetailModal(false);
        } finally {
            setDetailLoading(false);
        }
    };
    
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
            case 'pending_selection': return <Badge bg="warning">Chờ xử lý</Badge>;
            case 'confirmed': return <Badge bg="info">Đã xác nhận</Badge>;
            case 'shipped': return <Badge bg="primary">Đang giao</Badge>;
            case 'completed': return <Badge bg="success">Hoàn thành</Badge>;
            case 'cancelled': return <Badge bg="danger">Đã hủy</Badge>;
            default: return <Badge bg="secondary">{status}</Badge>;
        }
    };
    
    const toolOrderStatuses = [
        { value: 'pending', label: 'Chờ xử lý' },
        { value: 'confirmed', label: 'Đã xác nhận' },
        { value: 'shipped', label: 'Đang giao' },
        { value: 'completed', label: 'Hoàn thành' },
        { value: 'cancelled', label: 'Đã hủy' }
    ];

    if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Mã ĐH</th>
                        <th>Khách hàng</th>
                        <th>Sản phẩm</th>
                        <th>Ngày tạo</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td>{order.customer_name}</td>
                            <td style={{ minWidth: '300px' }}>{order.item_name}</td>
                            <td>{new Date(order.created_at).toLocaleString('vi-VN')}</td>
                            <td>{getStatusBadge(order.status)}</td>
                            <td>
                                <div className="d-flex gap-2">
                                    <Button variant="outline-info" size="sm" onClick={() => handleShowDetails(order)}>
                                        Xem
                                    </Button>
                                    <Form.Select
                                        size="sm"
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        style={{ width: '150px' }}
                                    >
                                        {toolOrderStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </Form.Select>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            
            <OrderDetailModal
                show={showDetailModal}
                handleClose={() => setShowDetailModal(false)}
                order={detailLoading ? null : selectedOrder}
            />
        </>
    );
};

export default OrderManagementTab;