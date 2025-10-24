import React, { useState, useContext } from 'react';
import { Container, Form, Button, Alert, Row, Col, Card, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Auth.css'; // Import file CSS tùy chỉnh

const RegisterPage = () => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const { fullName, email, password } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        const result = await register(fullName, email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <Container className="auth-container">
            <Row className="justify-content-center w-100">
                {/* Cột hình ảnh */}
                <Col lg={5} className="auth-image-container shadow-sm">
                </Col>

                {/* Cột Form */}
                <Col lg={5} md={8} sm={10}>
                    <Card className="auth-card">
                        <Card.Body className="auth-form-container">
                            <h2 className="text-center mb-4">Tạo tài khoản</h2>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={onSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Họ và Tên</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><i className="bi bi-person-fill"></i></InputGroup.Text>
                                        <Form.Control type="text" name="fullName" value={fullName} onChange={onChange} required placeholder="Nhập họ tên đầy đủ"/>
                                    </InputGroup>
                                </Form.Group>

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
                                        <Form.Control type="password" name="password" value={password} onChange={onChange} minLength="6" required placeholder="Tối thiểu 6 ký tự"/>
                                    </InputGroup>
                                </Form.Group>

                                <div className="d-grid">
                                    <Button variant="primary" type="submit" size="lg">Đăng ký</Button>
                                </div>
                            </Form>
                            <div className="text-center mt-4">
                                Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default RegisterPage;
