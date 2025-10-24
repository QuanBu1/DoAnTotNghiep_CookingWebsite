// src/components/OrderDetailModal.js
import React from 'react';
import { Modal, Table, ListGroup, Badge } from 'react-bootstrap';

const OrderDetailModal = ({ show, handleClose, order }) => {
    if (!order) return null;

    const getStatusBadge = (status) => {
         switch (status) {
            case 'cho xac nhan':
            case 'pending':
            case 'pending_selection':
                return <Badge bg="warning">Chờ xử lý</Badge>;
            case 'da xac nhan':
            case 'confirmed':
                return <Badge bg="info">Đã xác nhận</Badge>;
            case 'shipped':
                return <Badge bg="primary">Đang giao</Badge>;
            case 'completed':
                return <Badge bg="success">Hoàn thành</Badge>;
            case 'da huy':
            case 'cancelled':
                return <Badge bg="danger">Đã hủy</Badge>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Chi tiết Đơn hàng #{order.id}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h4>Thông tin Khách hàng</h4>
                <ListGroup className="mb-4">
                    <ListGroup.Item><strong>Tên:</strong> {order.customer_name}</ListGroup.Item>
                    <ListGroup.Item><strong>Email:</strong> {order.customer_email}</ListGroup.Item>
                    <ListGroup.Item><strong>SĐT:</strong> {order.customer_phone || 'Chưa cập nhật'}</ListGroup.Item>
                    {order.order_type === 'tool' && (
                        <ListGroup.Item><strong>Địa chỉ giao hàng:</strong> {order.shipping_address}</ListGroup.Item>
                    )}
                </ListGroup>

                <h4>Chi tiết Đơn hàng</h4>
                <ListGroup className="mb-4">
                     <ListGroup.Item><strong>Ngày tạo:</strong> {new Date(order.created_at).toLocaleString('vi-VN')}</ListGroup.Item>
                     <ListGroup.Item><strong>Trạng thái:</strong> {getStatusBadge(order.status)}</ListGroup.Item>
                     <ListGroup.Item><strong>Tổng tiền:</strong> <span className="text-danger fw-bold">{new Intl.NumberFormat('vi-VN').format(order.total_amount)} VND</span></ListGroup.Item>
                </ListGroup>

                <h4>Sản phẩm</h4>
                {order.order_type === 'course' ? (
                    <p><strong>Khóa học:</strong> {order.item_name}</p>
                ) : (
                    <Table striped bordered size="sm">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Số lượng</th>
                                <th>Đơn giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{new Intl.NumberFormat('vi-VN').format(item.price)} VND</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default OrderDetailModal;