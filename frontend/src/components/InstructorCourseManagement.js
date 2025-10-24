// src/components/InstructorCourseManagement.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, ButtonGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const InstructorCourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchCourses = useCallback(async () => {
        try {
            setError('');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Gọi API mới để chỉ lấy khóa học của giảng viên
            const res = await axios.get('/api/instructor/my-courses', config);
            setCourses(res.data);
        } catch (err) {
            setError('Không thể tải danh sách khóa học của bạn.');
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchCourses();
        }
    }, [token, fetchCourses]);

    const handleEdit = (courseId) => {
        navigate(`/courses/${courseId}/edit`);
    };

    const handleAddLesson = (courseId) => {
        navigate(`/courses/${courseId}`); // Chuyển đến trang chi tiết để thêm/sửa bài học
    }

    return (
        <>
            {error && <Alert variant="danger">{error}</Alert>}
            <div className="d-flex justify-content-end mb-3">
                <Button variant="primary" onClick={() => navigate('/add-course')}>+ Tạo khóa học mới</Button>
            </div>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Tên khóa học</th>
                        <th>Giá (VND)</th>
                        <th>Cấp độ</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {courses.map(course => (
                        <tr key={course.id}>
                            <td>{course.title}</td>
                            <td>{new Intl.NumberFormat('vi-VN').format(course.price)}</td>
                            <td>{course.level}</td>
                            <td>
                                <ButtonGroup>
                                    <Button variant="outline-secondary" size="sm" onClick={() => handleAddLesson(course.id)}>Thêm/Sửa bài học</Button>
                                    <Button variant="outline-primary" size="sm" onClick={() => handleEdit(course.id)}>Sửa thông tin</Button>
                                </ButtonGroup>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
};

export default InstructorCourseManagement;