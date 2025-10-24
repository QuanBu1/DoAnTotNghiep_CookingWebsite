// src/pages/AboutPage.js
import React from 'react';
import { Container, Row, Col, Image, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Import framer-motion để tạo hiệu ứng
import './AboutPage.css'; // File CSS riêng cho trang này

// Helper component cho các khối nội dung có hiệu ứng
const AnimatedSection = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
};

const AboutPage = () => {
    return (
        <div className="about-page-v2">
            {/* 1. Hero Section với hiệu ứng Parallax */}
            <header className="about-hero-v2 text-white text-center">
                <div className="hero-overlay"></div>
                <Container className="hero-content">
                    <motion.h1 
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="display-3 fw-bold"
                    >
                        Khơi Nguồn Đam Mê Ẩm Thực
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="lead mt-3"
                    >
                        Bếp của Quân không chỉ là nơi học nấu ăn, mà là nơi kể lại những câu chuyện qua từng món ăn.
                    </motion.p>
                </Container>
            </header>

            {/* 2. Our Mission Section */}
            <section className="about-section-v2">
                <Container>
                    <AnimatedSection>
                        <Row className="align-items-center g-5">
                            <Col lg={6}>
                                <h2 className="section-title-v2">Sứ mệnh của chúng tôi</h2>
                                <p className="section-text-v2">
                                    Tại Bếp của Quân, chúng tôi tin rằng mỗi bữa ăn là một cơ hội để tạo ra kết nối. Sứ mệnh của chúng tôi là trao quyền cho mọi người, từ người mới bắt đầu đến những đầu bếp tại gia, để họ có thể tự tin sáng tạo trong chính căn bếp của mình.
                                </p>
                                <p className="section-text-v2">
                                    Chúng tôi mang đến những khóa học chất lượng, những công thức đã được kiểm chứng và một cộng đồng nồng hậu để cùng bạn chia sẻ niềm vui nấu nướng mỗi ngày.
                                </p>
                                <Button as={Link} to="/courses" variant="primary" size="lg" className="mt-3">Khám phá ngay</Button>
                            </Col>
                             <Col lg={6}>
                                <Image src="/images/banner6.png" rounded fluid alt="Sứ mệnh" className="shadow-lg" />
                            </Col>
                        </Row>
                    </AnimatedSection>
                </Container>
            </section>

            {/* 3. What We Offer Section - Giá Trị Cốt Lõi */}
            <section className="about-section-v2 bg-light-v2">
                <Container>
                    <AnimatedSection>
                        <h2 className="section-title-v2 text-center">Những Giá Trị Cốt Lõi</h2>
                        <Row className="text-center g-4 mt-4">
                            <Col md={4}>
                                <Card className="feature-card-v2 h-100">
                                    <Card.Body>
                                        <div className="feature-icon-v2"><i className="bi bi-lightbulb-fill"></i></div>
                                        <h4>Sáng tạo</h4>
                                        <p>Khuyến khích sự sáng tạo không giới hạn, biến những nguyên liệu quen thuộc thành các tác phẩm nghệ thuật.</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                 <Card className="feature-card-v2 h-100">
                                    <Card.Body>
                                        <div className="feature-icon-v2"><i className="bi bi-link-45deg"></i></div>
                                        <h4>Kết nối</h4>
                                        <p>Xây dựng một cộng đồng nơi mọi người cùng chia sẻ, học hỏi và truyền cảm hứng cho nhau qua niềm đam mê ẩm thực.</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="feature-card-v2 h-100">
                                    <Card.Body>
                                        <div className="feature-icon-v2"><i className="bi bi-patch-check-fill"></i></div>
                                        <h4>Chất lượng</h4>
                                        <p>Cam kết mang đến những bài giảng chất lượng cao từ các chuyên gia, đảm bảo bạn có trải nghiệm học tập tốt nhất.</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </AnimatedSection>
                </Container>
            </section>

            {/* 4. MỤC MỚI: Đội Ngũ Giảng Viên */}
            <section className="about-section-v2">
                <Container>
                    <AnimatedSection>
                        <Row className="align-items-center g-5 flex-row-reverse"> 
                            <Col lg={6}>
                                <h2 className="section-title-v2">Đội Ngũ Giảng Viên Chuyên Nghiệp</h2>
                                <p className="section-text-v2">
                                    Chúng tôi tự hào quy tụ những **đầu bếp chuyên nghiệp và giảng viên giàu kinh nghiệm**, những người không chỉ có kiến thức sâu sắc mà còn có khả năng truyền đạt niềm đam mê đến từng học viên. 
                                </p>
                                <p className="section-text-v2">
                                    Mỗi giảng viên đều là chuyên gia trong một phong cách ẩm thực nhất định, từ món Việt truyền thống đến các kỹ thuật làm bánh phức tạp. Họ chính là bảo chứng cho chất lượng nội dung của Bếp của Quân.
                                </p>
                                
                            </Col>
                            <Col lg={6}>
                                <Image src="/images/daubep1.png" rounded fluid alt="Đội ngũ Giảng viên" className="shadow-lg" />
                            </Col>
                        </Row>
                    </AnimatedSection>
                </Container>
            </section>
            
            {/* 5. Parallax Banner */}
            <div className="parallax-banner"></div>

            {/* 6. MỤC MỚI: Cộng Đồng Công Thức */}
            <section className="about-section-v2 bg-light-v2">
                <Container>
                    <AnimatedSection>
                        <Row className="align-items-center g-5">
                            <Col lg={6}>
                                <h2 className="section-title-v2">Cộng Đồng và Sáng Tạo</h2>
                                <p className="section-text-v2">
                                    Ngoài các khóa học chính thức, Bếp của Quân còn là nơi bạn có thể **chia sẻ công thức cá nhân**, nhận phản hồi từ cộng đồng và lưu giữ những món ăn tâm huyết của mình.
                                </p>
                                <p className="section-text-v2">
                                    Bạn có thể tương tác (like, thả tim) với công thức của người khác và đóng góp vào kho tàng ẩm thực khổng lồ của chúng tôi. Đây là trái tim kết nối của mọi người yêu bếp!
                                </p>
                                <Button as={Link} to="/community-recipes" variant="outline-primary" size="lg" className="mt-3">Khám phá công thức</Button>
                            </Col>
                            <Col lg={6}>
                                <Image src="/images/indomie2.jpg" rounded fluid alt="Công thức Cộng đồng" className="shadow-lg" />
                            </Col>
                        </Row>
                    </AnimatedSection>
                </Container>
            </section>
            

            {/* 7. Call to Action Section */}
            <section className="cta-section-v2 text-center">
                <Container>
                    <AnimatedSection>
                        <h2 className="display-5 fw-bold">Tham gia cùng chúng tôi</h2>
                        <p className="lead my-4">
                            Hàng ngàn học viên đã bắt đầu hành trình ẩm thực của mình. Bạn đã sẵn sàng chưa?
                        </p>
                        <Button as={Link} to="/register" variant="light" size="lg">
                            Tạo tài khoản miễn phí
                        </Button>
                    </AnimatedSection>
                </Container>
            </section>
        </div>
    );
};

export default AboutPage;