// src/pages/SearchResultsPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import './HomePage.css'; // Tái sử dụng CSS từ HomePage

// Hàm để lấy query từ URL
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const SearchResultsPage = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const query = useQuery();
    const searchTerm = query.get("q");

    useEffect(() => {
        if (!searchTerm) {
            setCourses([]);
            setLoading(false);
            return;
        }

        const fetchSearchResults = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`/api/courses/search?q=${searchTerm}`);
                setCourses(response.data);
            } catch (err) {
                setError('Không thể tải kết quả tìm kiếm.');
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [searchTerm]); // Chạy lại mỗi khi từ khóa tìm kiếm thay đổi

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;

    return (
        <div className="section">
            <h1 className="section-title">
                Kết quả tìm kiếm cho: "{searchTerm}"
            </h1>
            {courses.length > 0 ? (
                <div className="courses-grid">
                    {courses.map(course => (
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
                <p>Không tìm thấy khóa học nào phù hợp.</p>
            )}
        </div>
    );
};

export default SearchResultsPage;