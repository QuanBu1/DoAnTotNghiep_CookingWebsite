// src/pages/HomePage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Spinner, Alert, Button, Row, Col, Card } from 'react-bootstrap';
import CourseSlider from '../components/CourseSlider';
import HeroSlider from '../components/HeroSlider';
import { motion } from 'framer-motion';
// Xóa 'useNavigate' khỏi dòng import này
import { Link } from 'react-router-dom';
import './HomePage.css';

const pageVariants = { initial: { opacity: 0 }, in: { opacity: 1 }, out: { opacity: 0 } };
const pageTransition = { duration: 0.5 };

const HomePage = () => {
    const [allCourses, setAllCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Xóa dòng khai báo không sử dụng này
    // const navigate = useNavigate(); 

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await axios.get('/api/courses');
                setAllCourses(res.data);
            } catch (err) {
                setError('Không thể tải dữ liệu khóa học.');
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const coursesByCuisine = (cuisine) => allCourses.filter(c => c.cuisine === cuisine);
    const coursesByLevel = (level) => allCourses.filter(c => c.level === level);

    const bakingCourses = coursesByLevel('nâng cao').filter(c => c.cuisine === 'Làm bánh');
    const vietnameseCourses = coursesByCuisine('Việt Nam');
    const popularCourses = allCourses.slice(0, 10);

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;

    return (
        <motion.div className="home-page" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
            {/* === 1. HERO SLIDER === */}
            <div className="hero-section">
                <Container>
                    <HeroSlider />
                </Container>
            </div>

            {/* === 2. FEATURE SECTION (KHU VỰC MỚI) === */}
            <div className="feature-section">
                <Container>
                    <h2 className="home-section-title text-center">Tại sao chọn Bếp của Quân?</h2>
                    <Row className="g-4 mt-4">
                        <Col md={4}>
                            <Card className="feature-card h-100">
                                <Card.Body>
                                    <div className="feature-icon"><i className="bi bi-person-video3"></i></div>
                                    <Card.Title as="h4">Học từ Chuyên gia</Card.Title>
                                    <Card.Text>
                                        Các bài giảng được xây dựng bởi đội ngũ đầu bếp giàu kinh nghiệm và chuyên môn cao.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="feature-card h-100">
                                <Card.Body>
                                    <div className="feature-icon"><i className="bi bi-journal-richtext"></i></div>
                                    <Card.Title as="h4">Công thức Đa dạng</Card.Title>
                                    <Card.Text>
                                        Khám phá hàng trăm công thức từ món Việt truyền thống đến các món bánh Âu phức tạp.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="feature-card h-100">
                                <Card.Body>
                                    <div className="feature-icon"><i className="bi bi-people-fill"></i></div>
                                    <Card.Title as="h4">Cộng đồng Đam mê</Card.Title>
                                    <Card.Text>
                                        Chia sẻ thành quả, học hỏi kinh nghiệm và kết nối với những người cùng chung sở thích.
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* === 3. COURSE SLIDERS SECTION === */}
            <div className="course-section">
                <Container>
                    <h2 className="home-section-title text-center">Khám phá các khóa học</h2>
                    
                    <div className="mt-5">
                        <h3 className="course-category-title">Khóa học Nổi bật</h3>
                        <CourseSlider courses={popularCourses} />
                    </div>
                    
                    {vietnameseCourses.length > 0 && (
                        <div className="mt-5 pt-4">
                            <h3 className="course-category-title">Ẩm thực Việt Nam</h3>
                            <CourseSlider courses={vietnameseCourses} />
                        </div>
                    )}

                    {bakingCourses.length > 0 && (
                        <div className="mt-5 pt-4">
                            <h3 className="course-category-title">Chuyên đề Làm Bánh</h3>
                            <CourseSlider courses={bakingCourses} />
                        </div>
                    )}
                </Container>
            </div>
            
            {/* === 4. COMMUNITY CTA BANNER (KHU VỰC MỚI) === */}
            <div className="community-cta-section">
                <Container>
                    <Row className="align-items-center">
                        <Col md={7}>
                            <h2>Gia nhập Cộng đồng Yêu Bếp</h2>
                            <p className="lead my-3">
                                Nơi hàng ngàn công thức được chia sẻ mỗi ngày. Hãy đăng tải món ăn tâm huyết của bạn và khám phá những sáng tạo mới từ mọi người!
                            </p>
                            <Button as={Link} to="/community-recipes" variant="warning" size="lg">Khám phá ngay</Button>
                        </Col>
                    </Row>
                </Container>
            </div>

        </motion.div>
    );
};

export default HomePage;