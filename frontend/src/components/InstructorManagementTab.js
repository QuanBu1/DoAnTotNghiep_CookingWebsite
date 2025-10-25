// src/components/InstructorManagementTab.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, ButtonGroup, Form, InputGroup, Row, Col, Spinner } from 'react-bootstrap'; // Thêm Form, InputGroup, Row, Col, Spinner
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import AddInstructorModal from './AddInstructorModal';
import EditInstructorModal from './EditInstructorModal';
import AdminPagination from './AdminPagination'; // Import component phân trang

const InstructorManagementTab = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    // State cho modal (giữ nguyên)
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState(null);

    // State cho tìm kiếm và phân trang
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(10);

    const fetchInstructors = useCallback(async (page = 1, search = searchTerm) => {
        setLoading(true);
        try {
            setError('');
            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                params: {
                    page,
                    limit,
                    search: search.trim()
                    // Không cần filter vì luôn là instructor
                }
            };
            const res = await axios.get('/api/admin/instructors-management', config); // API đã cập nhật
            setInstructors(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
            setCurrentPage(res.data.pagination.currentPage);
            setTotalItems(res.data.pagination.totalItems);
        } catch (err) {
            setError('Không thể tải danh sách giảng viên.');
            setInstructors([]);
            setTotalPages(1);
            setCurrentPage(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [token, limit, searchTerm]);

    useEffect(() => {
        if (token) {
            fetchInstructors(currentPage, searchTerm);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, currentPage]); // Bỏ fetchInstructors và searchTerm

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchInstructors(1, searchTerm);
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Các hàm xử lý modal giữ nguyên
    const handleEdit = (instructor) => {
        setEditingInstructor(instructor);
        setShowEditModal(true);
    };

    const handleDelete = async (instructorId) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa giảng viên ID: ${instructorId}?`)) {
            try {
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                await axios.delete(`/api/admin/instructors-management/${instructorId}`, config);
                fetchInstructors(currentPage, searchTerm); // Tải lại trang hiện tại
            } catch (err) {
                setError(err.response?.data?.msg || 'Xóa giảng viên thất bại.');
            }
        }
    };

    return (
        <>
            {/* Thanh công cụ */}
            <Row className="mb-3 g-2 align-items-center">
                <Col md="auto">
                    <Button variant="primary" onClick={() => setShowAddModal(true)}>+ Thêm giảng viên</Button>
                </Col>
                <Col>
                    <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Tìm theo tên hoặc email..."
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
                 <small className="text-muted">Hiển thị {instructors.length} trên tổng số {totalItems} giảng viên</small>
                 {loading && <Spinner animation="border" size="sm" />}
            </div>

            {/* Bảng dữ liệu */}
            <Table striped bordered hover responsive>
                 <thead>
                    <tr>
                        <th>ID</th>
                        <th>Họ Tên</th>
                        <th>Email</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                     {!loading && instructors.map(instructor => (
                        <tr key={instructor.id}>
                            <td>{instructor.id}</td>
                            <td>{instructor.full_name}</td>
                            <td>{instructor.email}</td>
                            <td>{new Date(instructor.created_at).toLocaleDateString('vi-VN')}</td>
                            <td>
                                <ButtonGroup size="sm">
                                    <Button variant="outline-primary" onClick={() => handleEdit(instructor)} title="Sửa"><i className="bi bi-pencil-fill"></i></Button>
                                    <Button variant="outline-danger" onClick={() => handleDelete(instructor.id)} title="Xóa"><i className="bi bi-trash-fill"></i></Button>
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
                     {!loading && instructors.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center text-muted">Không tìm thấy giảng viên nào.</td>
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

            {/* Modals */}
            <AddInstructorModal show={showAddModal} handleClose={() => setShowAddModal(false)} onInstructorAdded={() => fetchInstructors(1)} />
            <EditInstructorModal show={showEditModal} handleClose={() => setShowEditModal(false)} instructor={editingInstructor} onInstructorUpdated={() => fetchInstructors(currentPage, searchTerm)} />
        </>
    );
};

export default InstructorManagementTab;