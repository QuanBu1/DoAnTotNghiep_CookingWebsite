// src/pages/BakingPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import './HomePage.css'; // Tái sử dụng CSS từ HomePage

const BakingPage = () => {
    const [bakingCourses, setBakingCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await axios.get('/api/courses');
                
                // === LOGIC LỌC ĐÃ ĐƯỢC NÂNG CẤP TẠI ĐÂY ===
                // Một khóa học được coi là "làm bánh" NẾU:
                // 1. Phong cách (cuisine) của nó là "Làm Bánh", HOẶC
                // 2. Phương pháp chế biến (cooking_style) của nó là "Bánh các loại".
                const filteredCourses = response.data.filter(course => {
                    const cuisineMatch = course.cuisine && course.cuisine.trim().toLowerCase() === 'làm bánh';
                    const cookingStyleMatch = course.cooking_style && course.cooking_style.trim().toLowerCase() === 'bánh các loại';
                    return cuisineMatch || cookingStyleMatch;
                });

                setBakingCourses(filteredCourses);
            } catch (err) {
                setError('Không thể tải danh sách khóa học làm bánh.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;

    return (
        <div className="section">
            <h1 className="section-title">Công thức làm bánh</h1>
            {bakingCourses.length > 0 ? (
                <div className="courses-grid">
                    {bakingCourses.map(course => (
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
                <p>Chưa có khóa học làm bánh nào được thêm vào.</p>
            )}
        </div>
    );
};

export default BakingPage;