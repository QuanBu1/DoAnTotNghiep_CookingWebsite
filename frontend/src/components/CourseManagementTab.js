// src/components/CourseManagementTab.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, ButtonGroup, Form, InputGroup, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import AddCourseModal from './AddCourseModal';
import AdminPagination from './AdminPagination';
import ConfirmDeleteModal from './ConfirmDeleteModal'; // <-- 1. IMPORT MODAL MỚI

const CourseManagementTab = () => {
    const [courses, setCourses] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [showAddModal, setShowAddModal] = useState(false);

    // --- 2. THÊM STATE CHO MODAL XÓA ---
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingCourseId, setDeletingCourseId] = useState(null);
    // ------------------------------------

    const [searchTerm, setSearchTerm] = useState('');
    const [filterInstructor, setFilterInstructor] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(10);

    // ... (Giữ nguyên các hàm: fetchInstructorsForFilter, fetchCourses, useEffect, handlePageChange, handleSearch, handleFilterChange, handleSearchInputChange, handleSearchKeyPress, handleEdit) ...
    const fetchInstructorsForFilter = useCallback(async () => {
        if (!token) return;
        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const res = await axios.get('/api/admin/instructors', config);
            setInstructors(res.data);
        } catch (err) {
            console.error('Không thể tải danh sách giảng viên cho bộ lọc.');
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
                    filter: filter 
                }
            };
            const res = await axios.get('/api/admin/courses', config);
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
            fetchInstructorsForFilter();
            fetchCourses(currentPage, searchTerm, filterInstructor);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, currentPage, filterInstructor]); 

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
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

     const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };
    
    const handleEdit = (courseId) => {
        navigate(`/courses/${courseId}/edit`);
    };

    // --- 3. SỬA LẠI HÀM XÓA ---
    const handleDelete = (courseId) => {
        setDeletingCourseId(courseId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingCourseId) return;
        try {
            setError('');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            await axios.delete(`/api/admin/courses/${deletingCourseId}`, config);
            fetchCourses(currentPage, searchTerm, filterInstructor); // Tải lại
        } catch (err) {
            setError(err.response?.data?.msg || 'Xóa khóa học thất bại.');
        } finally {
            setShowDeleteModal(false);
            setDeletingCourseId(null);
        }
    };
    // ----------------------------

    return (
        <>
            {/* Thanh công cụ (Giữ nguyên) */}
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

            {/* Thông tin tổng số và loading (Giữ nguyên) */}
             <div className="d-flex justify-content-between align-items-center mb-2">
                 <small className="text-muted">Hiển thị {courses.length} trên tổng số {totalItems} khóa học</small>
                 {loading && <Spinner animation="border" size="sm" />}
            </div>

            {/* Bảng dữ liệu (Giữ nguyên) */}
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
                                    {/* 4. Sửa nút Xóa */}
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

            {/* Phân trang (Giữ nguyên) */}
            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            {/* Modal thêm mới (Giữ nguyên) */}
            <AddCourseModal show={showAddModal} handleClose={() => setShowAddModal(false)} onCourseAdded={() => fetchCourses(1)} />

            {/* 5. THÊM MODAL XÁC NHẬN VÀO CUỐI */}
            <ConfirmDeleteModal
                show={showDeleteModal}
                handleClose={() => setShowDeleteModal(false)}
                handleConfirm={confirmDelete}
                title="Xác nhận Xóa Khóa học"
                message={`Bạn chắc chắn muốn xóa khóa học ID: ${deletingCourseId}? Hành động này sẽ xóa TẤT CẢ bài học, bình luận, và dữ liệu ghi danh liên quan.`}
            />
        </>
    );
};

export default CourseManagementTab;