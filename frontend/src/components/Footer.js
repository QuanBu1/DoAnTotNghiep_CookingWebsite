// src/components/Footer.js
import React from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="main-footer">
            <Container>
                <Row className="gy-4">
                    {/* Cột 1: Logo và Giới thiệu */}
                    <Col lg={4} md={12} className="footer-col about-col">
                        <Link to="/" className="footer-logo-link">
                            <img src="/images/logo1.png" alt="Bếp của Quân Logo" className="footer-logo-img" />
                        </Link>
                        <p className="mt-3">
                            Khơi nguồn đam mê nấu nướng, sẻ chia hương vị hạnh phúc. Nền tảng học nấu ăn trực tuyến hàng đầu, mang đến những kiến thức bổ ích cho cộng đồng yêu bếp.
                        </p>
                        <div className="social-icons mt-4">
                            <Nav.Link href="#" aria-label="Youtube"><i className="bi bi-youtube"></i></Nav.Link>
                            <Nav.Link href="#" aria-label="Facebook"><i className="bi bi-facebook"></i></Nav.Link>
                            <Nav.Link href="#" aria-label="Tiktok"><i className="bi bi-tiktok"></i></Nav.Link>
                        </div>
                    </Col>

                    {/* Cột 2: Khám phá */}
                    <Col lg={2} md={4} xs={6} className="footer-col">
                        <h5 className="footer-col-title">Khám phá</h5>
                        <Nav className="flex-column">
                            <Nav.Link as={Link} to="/courses">Khóa học</Nav.Link>
                            <Nav.Link as={Link} to="/community-recipes">Công thức</Nav.Link>
                            <Nav.Link as={Link} to="/kitchen-tools">Dụng cụ bếp</Nav.Link>
                            <Nav.Link as={Link} to="/about">Về chúng tôi</Nav.Link>
                        </Nav>
                    </Col>

                    {/* Cột 3: Hỗ trợ */}
                    <Col lg={2} md={4} xs={6} className="footer-col">
                        <h5 className="footer-col-title">Hỗ trợ</h5>
                        <Nav className="flex-column">
                            <Nav.Link as={Link} to="/contact">Liên hệ</Nav.Link>
                            <Nav.Link as={Link} to="#">FAQ</Nav.Link>
                            <Nav.Link as={Link} to="#">Chính sách bảo mật</Nav.Link>
                            <Nav.Link as={Link} to="#">Điều khoản dịch vụ</Nav.Link>
                        </Nav>
                    </Col>
                    
                    {/* Cột 4: Thông tin liên hệ */}
                    <Col lg={4} md={4} xs={12} className="footer-col contact-col">
                        <h5 className="footer-col-title">Thông tin liên hệ</h5>
                        <ul className="contact-list">
                            <li>
                                <i className="bi bi-geo-alt-fill"></i>
                                <span>27 Lê Văn Lương, Thanh Xuân, Hà Nội, Việt Nam</span>
                            </li>
                            <li>
                                <i className="bi bi-telephone-fill"></i>
                                <a href="tel:0123456789">0123.456.789</a>
                            </li>
                            <li>
                                <i className="bi bi-envelope-fill"></i>
                                <a href="mailto:contact@bepcuaquan.com">contact@bepcuaquan.com</a>
                            </li>
                        </ul>
                    </Col>
                </Row>
            </Container>

            <div className="footer-bottom">
                <Container>
                    <p className="mb-0">© {new Date().getFullYear()} Bếp của Quân. All rights reserved.</p>
                </Container>
            </div>
        </footer>
    );
};

export default Footer;