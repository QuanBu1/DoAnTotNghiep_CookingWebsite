// src/components/CourseManagementTab.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, ButtonGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import AddCourseModal from './AddCourseModal';
// 2. Không cần import EditCourseModal nữa

const CourseManagementTab = () => {
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);
    const navigate = useNavigate(); // 3. Khởi tạo navigate

    const [showAddModal, setShowAddModal] = useState(false);
    // 4. Không cần state cho Edit Modal nữa

    const fetchCourses = useCallback(async () => {
        try {
            setError('');
            const res = await axios.get('http://localhost:5000/api/courses');
            setCourses(res.data);
        } catch (err) {
            setError('Không thể tải danh sách khóa học.');
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);
    
    // 5. Sửa hàm handleEdit để điều hướng
    const handleEdit = (courseId) => {
        navigate(`/courses/${courseId}/edit`);
    };

    const handleDelete = async (courseId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khóa học này? Mọi bài học liên quan cũng sẽ bị xóa vĩnh viễn.')) {
            try {
                setError('');
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                await axios.delete(`http://localhost:5000/api/admin/courses/${courseId}`, config);
                fetchCourses(); // Tải lại danh sách sau khi xóa
            } catch (err) {
                setError(err.response?.data?.msg || 'Xóa khóa học thất bại.');
            }
        }
    };

    return (
        <>
            <div className="d-flex justify-content-end mb-3">
                <Button variant="primary" onClick={() => setShowAddModal(true)}>+ Thêm khóa học</Button>
            </div>
            {error && <Alert variant="danger">{error}</Alert>}
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên khóa học</th>
                        <th>Giảng viên</th>
                        <th>Giá (VND)</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {courses.map(course => (
                        <tr key={course.id}>
                            <td>{course.id}</td>
                            <td>{course.title}</td>
                            <td>{course.instructor_name}</td>
                            <td>{course.price}</td>
                            <td>
                                <ButtonGroup>
                                    {/* 6. Gọi hàm handleEdit mới */}
                                    <Button variant="outline-primary" size="sm" onClick={() => handleEdit(course.id)}>Sửa</Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(course.id)}>Xóa</Button>
                                </ButtonGroup>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <AddCourseModal show={showAddModal} handleClose={() => setShowAddModal(false)} onCourseAdded={fetchCourses} />
            {/* 7. Không cần EditCourseModal ở đây nữa */}
        </>
    );
};

export default CourseManagementTab;