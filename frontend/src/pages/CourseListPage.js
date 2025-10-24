// src/pages/CourseListPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Spinner, Alert, Form, Row, Col } from 'react-bootstrap';
import './HomePage.css';

const CourseListPage = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCuisine, setSelectedCuisine] = useState('');
    const [selectedCookingStyle, setSelectedCookingStyle] = useState('');
    // THÊM MỚI: State cho bộ lọc giá
    const [priceFilter, setPriceFilter] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await axios.get('/api/courses');
                setCourses(response.data);
            } catch (err) {
                setError('Không thể tải danh sách khóa học.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);
    
    const handleCuisineChange = (e) => {
        setSelectedCuisine(e.target.value);
        setSelectedCookingStyle('');
    }

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;

    const uniqueCuisines = [...new Set(courses.map(course => course.cuisine ? course.cuisine.trim() : '').filter(Boolean))];
    const vietnameseCookingStyles = ["Kho", "Chiên", "Xào", "Nướng", "Hấp", "Lẩu", "Bánh các loại", "Cách chế biến khác"];

    // THÊM MỚI: Cập nhật logic lọc để bao gồm cả bộ lọc giá
    const filteredCourses = courses.filter(course => {
        const cuisineMatch = selectedCuisine ? (course.cuisine || '').trim().toLowerCase() === selectedCuisine.toLowerCase() : true;
        const styleMatch = selectedCookingStyle ? (course.cooking_style || '') === selectedCookingStyle : true;
        
        // Logic cho bộ lọc giá
        const priceMatch = () => {
            if (priceFilter === 'free') return parseFloat(course.price) <= 0;
            if (priceFilter === 'paid') return parseFloat(course.price) > 0;
            return true; // Mặc định là 'tất cả'
        };

        return cuisineMatch && styleMatch && priceMatch();
    });

    return (
        <div className="section">
            <Row className="justify-content-between align-items-center mb-4">
                <Col md="auto">
                    <h1 className="section-title mb-0">Tất cả Khóa học</h1>
                </Col>
                <Col md={8} lg={6} className="d-flex justify-content-end gap-3 flex-wrap">
                    {/* THÊM MỚI: Bộ lọc giá */}
                    <Form.Group controlId="priceFilter" style={{ minWidth: '150px' }}>
                        <Form.Label className="fw-semibold">Mức phí</Form.Label>
                        <Form.Select value={priceFilter} onChange={e => setPriceFilter(e.target.value)}>
                            <option value="">Tất cả</option>
                            <option value="free">Miễn phí</option>
                            <option value="paid">Có phí</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group controlId="cuisineFilter" style={{ minWidth: '180px' }}>
                        <Form.Label className="fw-semibold">Phong cách</Form.Label>
                        <Form.Select value={selectedCuisine} onChange={handleCuisineChange}>
                            <option value="">Tất cả</option>
                            {uniqueCuisines.map(c => <option key={c} value={c}>{c}</option>)}
                        </Form.Select>
                    </Form.Group>

                    {(selectedCuisine || '').trim().toLowerCase() === 'việt' && (
                        <Form.Group controlId="styleFilter" style={{ minWidth: '180px' }}>
                            <Form.Label className="fw-semibold">Phương pháp</Form.Label>
                            <Form.Select value={selectedCookingStyle} onChange={e => setSelectedCookingStyle(e.target.value)}>
                                <option value="">Tất cả</option>
                                {vietnameseCookingStyles.map(style => <option key={style} value={style}>{style}</option>)}
                            </Form.Select>
                        </Form.Group>
                    )}
                </Col>
            </Row>

            {filteredCourses.length > 0 ? (
                <div className="courses-grid">
                    {filteredCourses.map(course => (
                        <Link to={`/courses/${course.id}`} key={course.id} className="course-card-link">
                            <div className="course-card">
                                <img src={course.image_url} alt={course.title} className="course-card-image" />
                                <div className="course-card-body">
                                    <h5>{course.title}</h5>
                                    <p>Giảng viên: {course.instructor_name}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <Alert variant="info" className="text-center mt-4">
                    Không tìm thấy khóa học nào phù hợp với lựa chọn của bạn.
                </Alert>
            )}
        </div>
    );
};

export default CourseListPage;