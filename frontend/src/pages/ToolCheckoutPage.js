// src/pages/ToolCheckoutPage.js
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Alert, Button, Form } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const ToolCheckoutPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useContext(AuthContext);

    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [shippingAddress, setShippingAddress] = useState(user?.address || '');
    const [countdown, setCountdown] = useState(180);
    const [paymentStatus, setPaymentStatus] = useState(null);

    const pollingIntervalRef = useRef(null);

    const handleCancelOrder = useCallback(async () => {
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`/api/orders/tools/${orderId}/cancel`, {}, config);
            setPaymentStatus('cancelled');
            if (countdown <= 0) {
                toast.error("Đơn hàng đã hết hạn thanh toán và bị hủy tự động.");
            }
        } catch (err) {
            if (err.response?.status !== 400) {
                toast.error('Không thể hủy đơn hàng. Vui lòng kiểm tra lại.');
            }
        }
    }, [token, orderId, countdown]);

    const handleConfirmOrder = async (e) => {
        e.preventDefault();
        if (!shippingAddress || shippingAddress.trim() === '') {
            toast.error('Vui lòng cung cấp địa chỉ giao hàng hợp lệ.');
            return;
        }
        
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const paymentMethod = orderDetails.payment_method;
            const body = { payment_method: paymentMethod, shipping_address: shippingAddress };
            
            // SỬA LỖI 1: Bỏ `const res =` vì không dùng đến
            await axios.put(`/api/orders/tools/${orderId}/confirm`, body, config);
            
            await fetchOrderDetails(); 
            toast.success("Đơn hàng đã được xác nhận thành công!");

        } catch (err) {
            toast.error(err.response?.data?.msg || 'Lỗi khi xác nhận đơn hàng.');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentMethodSelect = async (method) => {
        setOrderDetails(prev => ({ ...prev, payment_method: method }));
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`/api/orders/tools/${orderId}/confirm`, { payment_method: method, shipping_address: shippingAddress }, config);
        } catch (err) {
            toast.error("Lỗi khi chọn phương thức thanh toán.");
        }
    };

    const fetchOrderDetails = useCallback(async () => {
        if (!token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`/api/orders/tools/${orderId}`, config);
            
            setOrderDetails(res.data);
            setPaymentStatus(res.data.status);

            if (res.data.shipping_address) {
                setShippingAddress(res.data.shipping_address);
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Không thể tải chi tiết đơn hàng.');
        } finally {
            setLoading(false);
        }
    }, [orderId, token]);

    useEffect(() => {
        if (!token) {
            toast.error("Vui lòng đăng nhập.");
            navigate('/login');
            return;
        }
        fetchOrderDetails();
    }, [fetchOrderDetails, token, navigate]);

    useEffect(() => {
        if (paymentStatus === 'pending' && orderDetails?.payment_method === 'bank_transfer') {
            if (countdown <= 0) {
                handleCancelOrder();
                return;
            }
            const timer = setInterval(() => setCountdown(c => c - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [countdown, paymentStatus, orderDetails?.payment_method, handleCancelOrder]);

    const pollStatus = useCallback(async () => {
        if (paymentStatus !== 'pending') return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`/api/orders/tools/${orderId}/status`, config);
            const newStatus = res.data.status;

            if (newStatus !== 'pending') {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                setPaymentStatus(newStatus);
                if (newStatus === 'confirmed') {
                    toast.success("Thanh toán hoàn tất! Đang chuyển hướng...");
                    setTimeout(() => navigate('/orders/tools/history'), 2000);
                }
            }
        } catch (err) {
            console.error("Lỗi khi polling status", err);
        }
    }, [paymentStatus, token, orderId, navigate]);

    useEffect(() => {
        if (paymentStatus === 'pending' && orderDetails?.payment_method === 'bank_transfer' && !pollingIntervalRef.current) {
            pollingIntervalRef.current = setInterval(pollStatus, 3000);
        }
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [paymentStatus, orderDetails?.payment_method, pollStatus]);

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!orderDetails) return null;
    
    // SỬA LỖI 2: Xóa bỏ biến không dùng đến
    // const isAwaitingSelection = paymentStatus === 'pending_selection'; 
    const isAwaitingBankTransfer = paymentStatus === 'pending' && orderDetails.payment_method === 'bank_transfer';
    const isConfirmedByCOD = paymentStatus === 'confirmed' && orderDetails.payment_method === 'cod';
    const isSuccess = paymentStatus === 'confirmed' || paymentStatus === 'shipped' || paymentStatus === 'completed';
    const isCancelled = paymentStatus === 'cancelled';
    
    const paymentDescription = orderDetails.temp_transaction_code || `TOOL${orderId}`;
    const qrCodeUrl = `https://qr.sepay.vn/img?bank=MBBank&acc=0372122362222&template=compact&amount=${parseInt(orderDetails.total_amount)}&des=${encodeURIComponent(paymentDescription)}`;
    
    return (
        <Container className="my-5">
            <Row className="justify-content-center">
                <Col lg={9}>
                    <h2 className="text-center mb-4">🛒 Thanh Toán Đơn Hàng Dụng Cụ #{orderId}</h2>
                    
                    {isSuccess && (
                        <Alert variant="success" className="text-center p-4">
                            <h2>Đơn hàng đã được xác nhận!</h2>
                            <p>Cảm ơn bạn đã mua hàng. Chúng tôi sẽ xử lý đơn hàng của bạn sớm nhất có thể.</p>
                            <Button variant="success" onClick={() => navigate('/orders/tools/history')}>Xem lịch sử đơn hàng</Button>
                        </Alert>
                    )}
                    
                    {isCancelled && (
                        <Alert variant="danger" className="text-center p-4">
                            <h2>Đơn hàng đã bị HỦY</h2>
                            <p>Đơn hàng đã hết hạn hoặc bị bạn hủy. Vui lòng tạo đơn hàng mới.</p>
                            <Button variant="danger" onClick={() => navigate('/kitchen-tools')}>Quay lại cửa hàng</Button>
                        </Alert>
                    )}
                    
                    { !isSuccess && !isCancelled && (
                    <Card className="shadow-lg">
                        <Card.Header as="h4" className="bg-primary text-white">Chi tiết Đơn hàng</Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6} className="border-end mb-3">
                                    <h5 className="mb-3">1. Thông tin Giao hàng</h5>
                                    <Form onSubmit={handleConfirmOrder}>
                                        <p><strong>Người nhận:</strong> {user?.full_name}</p>
                                        <Form.Group className="mb-3" controlId="shippingAddress">
                                            <Form.Label><strong>Địa chỉ Giao hàng:</strong></Form.Label>
                                            <Form.Control 
                                                as="textarea" rows={3}
                                                value={shippingAddress}
                                                onChange={(e) => setShippingAddress(e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </Form>
                                    <hr />
                                    <h5 className="mb-3">Chi tiết Sản phẩm</h5>
                                    {orderDetails.items?.map((item, index) => (
                                        <div key={index} className="d-flex justify-content-between mb-1">
                                            <span>{item.name} x {item.quantity}</span>
                                            <span>{new Intl.NumberFormat('vi-VN').format(item.subtotal)} VND</span>
                                        </div>
                                    ))}
                                    <hr />
                                    <div className="d-flex justify-content-between h5">
                                        <strong>Tổng cộng:</strong>
                                        <strong className="text-danger">{new Intl.NumberFormat('vi-VN').format(orderDetails.total_amount)} VND</strong>
                                    </div>
                                </Col>

                                <Col md={6}>
                                    <h5 className="mb-3">2. Phương thức Thanh toán</h5>
                                    
                                    {isAwaitingBankTransfer && (
                                         <Alert variant="warning" className="text-center">
                                            Đơn hàng sẽ hết hạn sau: <strong className="h5">{formatTime(countdown)}</strong>
                                        </Alert>
                                    )}

                                    <div className="d-grid gap-2">
                                        <Button 
                                            variant={orderDetails.payment_method === 'cod' ? 'success' : 'outline-secondary'} 
                                            onClick={() => handlePaymentMethodSelect('cod')}
                                            disabled={isAwaitingBankTransfer}
                                        >
                                            Thanh toán khi nhận hàng (COD)
                                        </Button>
                                        <Button 
                                            variant={orderDetails.payment_method === 'bank_transfer' ? 'success' : 'outline-secondary'} 
                                            onClick={() => handlePaymentMethodSelect('bank_transfer')}
                                            disabled={isConfirmedByCOD}
                                        >
                                            Chuyển khoản Ngân hàng
                                        </Button>
                                    </div>
                                    
                                    {isConfirmedByCOD && (
                                        <Alert variant='info' className="mt-3 text-center">Đơn hàng của bạn đã được xác nhận, chúng tôi sẽ sớm liên hệ để giao hàng.</Alert>
                                    )}

                                    {isAwaitingBankTransfer && (
                                        <Card body className="mt-3 border-success text-center">
                                            <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: '200px' }} className="mx-auto d-block mb-2" />
                                            <p className="mb-1"><strong>Ngân hàng:</strong> MBBank</p>
                                            <p className="mb-1"><strong>Số tài khoản:</strong> 0372122362222</p>
                                            <p className="text-danger">
                                                <strong>Nội dung (BẮT BUỘC):</strong> <strong className='text-primary'>{paymentDescription}</strong>
                                            </p>
                                            <Button variant="outline-danger" size="sm" className="mt-2" onClick={handleCancelOrder}>Hủy thanh toán</Button>
                                        </Card>
                                    )}
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default ToolCheckoutPage;