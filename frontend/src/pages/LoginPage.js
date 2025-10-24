// src/pages/LoginPage.js
import React, { useState, useContext } from 'react';
import { Container, Form, Button, Alert, Row, Col, Card, InputGroup } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Auth.css'; // Import file CSS tùy chỉnh

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const { email, password } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            // *** THAY ĐỔI NẰM Ở ĐÂY ***
            // Nếu người dùng truy cập trực tiếp trang login, chuyển hướng đến '/about' thay vì '/'
            const from = location.state?.from?.pathname || "/about";
            navigate(from, { replace: true });
        } else {
            setError(result.message);
        }
    };

    return (
        <Container className="auth-container">
            <Row className="justify-content-center w-100">
                {/* Cột hình ảnh, chỉ hiện trên màn hình lớn */}
                <Col lg={5} className="auth-image-container shadow-sm">
                </Col>

                {/* Cột Form */}
                <Col lg={5} md={8} sm={10}>
                    <Card className="auth-card">
                        <Card.Body className="auth-form-container">
                            <h2 className="text-center mb-4">Đăng nhập</h2>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={onSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Địa chỉ Email</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><i className="bi bi-envelope-fill"></i></InputGroup.Text>
                                        <Form.Control type="email" name="email" value={email} onChange={onChange} required placeholder="email@example.com"/>
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Mật khẩu</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><i className="bi bi-lock-fill"></i></InputGroup.Text>
                                        <Form.Control type="password" name="password" value={password} onChange={onChange} required placeholder="Nhập mật khẩu"/>
                                    </InputGroup>
                                </Form.Group>

                                <div className="d-grid">
                                    <Button variant="primary" type="submit" size="lg">Đăng nhập</Button>
                                </div>
                            </Form>
                            <div className="text-center mt-4">
                                Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default LoginPage;