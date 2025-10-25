// src/components/CourseManagementTab.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, ButtonGroup, Form, InputGroup, Row, Col, Spinner } from 'react-bootstrap'; // Thêm imports
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import AddCourseModal from './AddCourseModal';
import AdminPagination from './AdminPagination'; // Import

const CourseManagementTab = () => {
    const [courses, setCourses] = useState([]);
    const [instructors, setInstructors] = useState([]); // State cho danh sách giảng viên (bộ lọc)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    // State cho modal
    const [showAddModal, setShowAddModal] = useState(false);

    // State cho tìm kiếm, lọc, phân trang
    const [searchTerm, setSearchTerm] = useState('');
    const [filterInstructor, setFilterInstructor] = useState('all'); // 'all' hoặc instructor_id
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(10);

    // Fetch danh sách giảng viên để làm bộ lọc
    const fetchInstructorsForFilter = useCallback(async () => {
        if (!token) return;
        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const res = await axios.get('/api/admin/instructors', config); // API lấy danh sách giảng viên
            setInstructors(res.data);
        } catch (err) {
            console.error('Không thể tải danh sách giảng viên cho bộ lọc.');
            // Không set lỗi ở đây để không ảnh hưởng đến việc tải khóa học
        }
    }, [token]);

    const fetchCourses = useCallback(async (page = 1, search = searchTerm, filter = filterInstructor) => {
        setLoading(true);
        try {
            setError('');
            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                params: {
                    page,
                    limit,
                    search: search.trim(),
                    filter: filter // filter là instructor_id
                }
            };
            const res = await axios.get('/api/admin/courses', config); // API lấy khóa học đã cập nhật
            setCourses(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
            setCurrentPage(res.data.pagination.currentPage);
            setTotalItems(res.data.pagination.totalItems);
        } catch (err) {
            setError('Không thể tải danh sách khóa học.');
            setCourses([]);
            setTotalPages(1);
            setCurrentPage(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [token, limit, searchTerm, filterInstructor]);

    useEffect(() => {
        if (token) {
            fetchInstructorsForFilter(); // Tải danh sách giảng viên trước
            fetchCourses(currentPage, searchTerm, filterInstructor);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, currentPage, filterInstructor]); // Trigger khi token, trang hoặc bộ lọc thay đổi

    // Handlers tương tự UserManagementTab
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchCourses(1, searchTerm, filterInstructor);
    };

     const handleFilterChange = (e) => {
        setFilterInstructor(e.target.value);
        setCurrentPage(1);
        // fetchCourses sẽ tự gọi lại trong useEffect
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

     const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Hàm điều hướng và xóa giữ nguyên
    const handleEdit = (courseId) => {
        navigate(`/courses/${courseId}/edit`);
    };

    const handleDelete = async (courseId) => {
        if (window.confirm(`Bạn chắc chắn muốn xóa khóa học ID: ${courseId} và tất cả bài học liên quan?`)) {
            try {
                setError('');
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                await axios.delete(`/api/admin/courses/${courseId}`, config);
                fetchCourses(currentPage, searchTerm, filterInstructor); // Tải lại trang hiện tại
            } catch (err) {
                setError(err.response?.data?.msg || 'Xóa khóa học thất bại.');
            }
        }
    };

    return (
        <>
            {/* Thanh công cụ */}
             <Row className="mb-3 g-2 align-items-center">
                <Col md="auto">
                    <Button variant="primary" onClick={() => setShowAddModal(true)}>+ Thêm khóa học</Button>
                </Col>
                <Col md={3}>
                    <Form.Group controlId="courseFilterInstructor">
                        <Form.Select value={filterInstructor} onChange={handleFilterChange}>
                            <option value="all">Tất cả giảng viên</option>
                            {instructors.map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.full_name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col>
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Tìm theo tên hoặc mô tả khóa học..."
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            onKeyPress={handleSearchKeyPress}
                        />
                        <Button variant="outline-secondary" onClick={handleSearch}>
                             <i className="bi bi-search"></i> Tìm
                        </Button>
                    </InputGroup>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Thông tin tổng số và loading */}
             <div className="d-flex justify-content-between align-items-center mb-2">
                 <small className="text-muted">Hiển thị {courses.length} trên tổng số {totalItems} khóa học</small>
                 {loading && <Spinner animation="border" size="sm" />}
            </div>

            {/* Bảng dữ liệu */}
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
                    {!loading && courses.map(course => (
                        <tr key={course.id}>
                            <td>{course.id}</td>
                            <td>{course.title}</td>
                            <td>{course.instructor_name}</td>
                            <td>{new Intl.NumberFormat('vi-VN').format(course.price)}</td>
                            <td>
                                <ButtonGroup size="sm">
                                    <Button variant="outline-primary" onClick={() => handleEdit(course.id)} title="Sửa"><i className="bi bi-pencil-fill"></i></Button>
                                    <Button variant="outline-danger" onClick={() => handleDelete(course.id)} title="Xóa"><i className="bi bi-trash-fill"></i></Button>
                                </ButtonGroup>
                            </td>
                        </tr>
                    ))}
                     {loading && (
                        <tr>
                            <td colSpan="5" className="text-center">
                                <Spinner animation="border" size="sm" /> Đang tải...
                            </td>
                        </tr>
                     )}
                     {!loading && courses.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center text-muted">Không tìm thấy khóa học nào.</td>
                        </tr>
                     )}
                </tbody>
            </Table>

            {/* Phân trang */}
            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            {/* Modal thêm mới */}
            <AddCourseModal show={showAddModal} handleClose={() => setShowAddModal(false)} onCourseAdded={() => fetchCourses(1)} />
            {/* Không cần EditCourseModal vì đã điều hướng sang trang riêng */}
        </>
    );
};

export default CourseManagementTab;