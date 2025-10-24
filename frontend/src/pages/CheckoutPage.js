// src/pages/CheckoutPage.js

import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';

const CheckoutPage = () => {
    const { enrollmentId } = useParams();
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(300);
    const [paymentStatus, setPaymentStatus] = useState('cho xac nhan');
    
    // Sử dụng useRef để lưu ID của interval, giúp quản lý nó tốt hơn
    const pollingIntervalRef = useRef(null);

    // Effect 1: Lấy thông tin đơn hàng ban đầu
    useEffect(() => {
        if (!token) return;
        const fetchOrderDetails = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`/api/payment/checkout/${enrollmentId}`, config);
                setOrderDetails(res.data);
                // Nếu trạng thái ban đầu đã khác 'cho xac nhan', không cần làm gì thêm
                if (res.data.status !== 'cho xac nhan') {
                    setPaymentStatus(res.data.status);
                }
            } catch (err) {
                setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrderDetails();
    }, [enrollmentId, token]);

    // Effect 2: Xử lý đếm ngược và hủy đơn hàng
    useEffect(() => {
        if (paymentStatus !== 'cho xac nhan') return;

        if (countdown <= 0) {
            const cancel = async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    await axios.post(`/api/payment/cancel/${enrollmentId}`, {}, config);
                    setPaymentStatus('da huy');
                } catch (err) { console.error("Lỗi khi hủy đơn hàng"); }
            };
            cancel();
            return;
        }

        const timer = setInterval(() => setCountdown(c => c - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown, paymentStatus, enrollmentId, token]);


    // Effect 3: Hàm Polling thực hiện kiểm tra trạng thái
    const pollStatus = useCallback(async () => {
        // CHỈ POLL KHI ĐANG CHỜ THANH TOÁN
        if (!orderDetails || paymentStatus !== 'cho xac nhan') return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // API kiểm tra trạng thái
            const res = await axios.get(`/api/payment/status/${enrollmentId}`, config);
            const newStatus = res.data.status;

            if (newStatus === 'da xac nhan') {
                // Dừng Polling
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                
                setPaymentStatus('da xac nhan');
                
                // Chuyển hướng sau 3 giây
                setTimeout(() => {
                    navigate(`/courses/${orderDetails.course_id}`);
                }, 3000);
            } else if (newStatus === 'da huy') {
                // Dừng Polling
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
                setPaymentStatus('da huy');
            }
        } catch (err) {
            console.error("Lỗi khi kiểm tra trạng thái thanh toán", err);
        }
    }, [orderDetails, paymentStatus, enrollmentId, token, navigate]);


    // Effect 4: Quản lý Polling Interval
    useEffect(() => {
        // Chỉ khởi tạo Polling nếu đang chờ và chưa có interval nào đang chạy
        if (orderDetails && paymentStatus === 'cho xac nhan' && !pollingIntervalRef.current) {
            // Bắt đầu vòng lặp kiểm tra mỗi 3 giây
            pollingIntervalRef.current = setInterval(pollStatus, 3000); 
        }
        
        // Hàm dọn dẹp: đảm bảo interval sẽ bị xóa khi component bị hủy
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [paymentStatus, orderDetails, pollStatus]); // pollStatus là dependency quan trọng nhất


    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;

    const paymentDescription = `DKKH${enrollmentId}`;
    const amount = parseInt(orderDetails?.price || 0); 
    const qrCodeUrl = `https://qr.sepay.vn/img?bank=MBBank&acc=0372122362222&template=compact&amount=${amount}&des=${encodeURIComponent(paymentDescription)}`;
    
    return (
        <Container className="my-5">
             <Row className="justify-content-center">
                <Col lg={8}>
                    {paymentStatus === 'cho xac nhan' && (
                         <Card className="shadow-sm">
                            <Card.Header as="h4" className="text-center bg-primary text-white">Thanh toán Đơn hàng</Card.Header>
                            <Card.Body>
                                <div className="text-center p-3 mb-4 bg-light border rounded">
                                    <p className="lead">Khóa học: <strong>{orderDetails.course_title}</strong></p>
                                    <p className="h4 text-danger fw-bold">{new Intl.NumberFormat('vi-VN').format(orderDetails.price)} VND</p>
                                    <p className="text-muted">Mã đơn hàng: #{enrollmentId}</p>
                                </div>
                                <Alert variant="warning" className="text-center">
                                    Đơn hàng sẽ hết hạn sau: <strong className="h5">{formatTime(countdown)}</strong>
                                    <br />
                                    <small>Vui lòng không đóng trang này cho đến khi thanh toán thành công.</small>
                                </Alert>
                                <Row>
                                    <Col md={6} className="text-center">
                                        <h5>Quét mã QR để thanh toán</h5>
                                        <img src={qrCodeUrl} alt="QR Code Thanh toán" className="img-fluid" />
                                    </Col>
                                    <Col md={6}>
                                        <h5>Hoặc chuyển khoản thủ công</h5>
                                        <p><strong>Ngân hàng:</strong> MBBank</p>
                                        <p><strong>Chủ tài khoản:</strong> Trần Đình Quân</p>
                                        <p><strong>Số tài khoản:</strong> 0372122362222</p>
                                        <p><strong>Số tiền:</strong> <span className="text-danger fw-bold">{new Intl.NumberFormat('vi-VN').format(orderDetails.price)} VND</span></p>
                                        <p><strong>Nội dung:</strong> <span className="text-success fw-bold">{paymentDescription}</span></p>
                                        <Alert variant="info"><small>Lưu ý: Nhập chính xác nội dung chuyển khoản để được xác nhận tự động.</small></Alert>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                     {paymentStatus === 'da xac nhan' && (
                        <Alert variant="success" className="text-center p-5">
                            <h2>Thanh toán Thành công!</h2>
                            <p>Chúng tôi đã nhận được thanh toán của bạn. Khóa học đã được kích hoạt.</p>
                            <p>Trang sẽ tự động chuyển hướng sau vài giây...</p>
                            <Spinner animation="border" />
                        </Alert>
                    )}
                     {paymentStatus === 'da huy' && (
                        <Alert variant="danger" className="text-center p-5">
                            <h2>Đơn hàng đã bị hủy</h2>
                            <p>Đã hết thời gian thanh toán. Vui lòng thực hiện lại việc đăng ký.</p>
                            <Button as={Link} to="/courses" variant="primary">Quay lại danh sách khóa học</Button>
                        </Alert>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default CheckoutPage;