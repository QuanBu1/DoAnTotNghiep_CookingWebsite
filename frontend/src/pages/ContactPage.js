// src/pages/ContactPage.js
import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import axios from 'axios';
import './ContactPage.css';

const ContactPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState({ success: false, error: false, message: '' });

    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ success: false, error: false, message: '' });
        try {
            const res = await axios.post('/api/contact/submit', formData);
            setStatus({ success: true, message: res.data.msg });
            setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
        } catch (err) {
            setStatus({ error: true, message: err.response?.data?.msg || 'Gửi tin nhắn thất bại.' });
        }
    };

    return (
        <div className="contact-page">
            <Container>
                <div className="text-center mb-5">
                    <h1 className="contact-title">Liên hệ với chúng tôi</h1>
                    <p className="lead">Chúng tôi luôn sẵn sàng lắng nghe. Hãy gửi thắc mắc của bạn cho Bếp của Quân nhé!</p>
                </div>
                <Row className="g-5">
                    {/* Cột thông tin liên hệ */}
                    <Col lg={5}>
                        <h3 className="info-title">Thông tin liên hệ</h3>
                        {/* --- PHẦN BỊ THIẾU ĐÃ ĐƯỢC BỔ SUNG LẠI Ở ĐÂY --- */}
                        <div className="contact-info-card">
                            <div className="info-item">
                                <i className="bi bi-geo-alt-fill"></i>
                                <div>
                                    <h5>Địa chỉ</h5>
                                    <p>27 Lê Văn Lương, Thanh Xuân, Hà Nội</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <i className="bi bi-envelope-fill"></i>
                                <div>
                                    <h5>Email</h5>
                                    <p>contact@bepcuaquan.com</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <i className="bi bi-telephone-fill"></i>
                                <div>
                                    <h5>Điện thoại</h5>
                                    <p>0123.456.789</p>
                                </div>
                            </div>
                        </div>
                        {/* --- KẾT THÚC PHẦN BỔ SUNG --- */}
                    </Col>
                    {/* Cột form liên hệ */}
                    <Col lg={7}>
                        <Card className="contact-form-card">
                            <Card.Body>
                                <h3 className="form-title">Gửi tin nhắn cho chúng tôi</h3>
                                {status.success && <Alert variant="success">{status.message}</Alert>}
                                {status.error && <Alert variant="danger">{status.message}</Alert>}
                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="formContactName">
                                                <Form.Label>Họ và Tên</Form.Label>
                                                <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nhập họ tên của bạn" required />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="formContactEmail">
                                                <Form.Label>Email</Form.Label>
                                                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" required />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Form.Group className="mb-3" controlId="formContactSubject">
                                        <Form.Label>Chủ đề</Form.Label>
                                        <Form.Control type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Chủ đề bạn quan tâm" required />
                                    </Form.Group>
                                    <Form.Group className="mb-4" controlId="formContactMessage">
                                        <Form.Label>Nội dung</Form.Label>
                                        <Form.Control as="textarea" rows={5} name="message" value={formData.message} onChange={handleChange} placeholder="Nội dung tin nhắn..." required />
                                    </Form.Group>
                                    <div className="d-grid">
                                        <Button variant="primary" size="lg" type="submit">
                                            Gửi tin nhắn
                                        </Button>
                                    </div>
                                </Form>
                                </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default ContactPage;