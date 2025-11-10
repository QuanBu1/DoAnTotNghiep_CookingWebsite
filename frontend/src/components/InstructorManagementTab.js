// src/components/InstructorManagementTab.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, ButtonGroup, Form, InputGroup, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import AddInstructorModal from './AddInstructorModal';
import EditInstructorModal from './EditInstructorModal';
import AdminPagination from './AdminPagination';
import ConfirmDeleteModal from './ConfirmDeleteModal'; // <-- 1. IMPORT MODAL MỚI

const InstructorManagementTab = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    // State cho modal (giữ nguyên)
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState(null);

    // --- 2. THÊM STATE CHO MODAL XÓA ---
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingInstructorId, setDeletingInstructorId] = useState(null);
    // ------------------------------------

    // State cho tìm kiếm và phân trang
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(10);

    // ... (Giữ nguyên các hàm: fetchInstructors, useEffect, handlePageChange, handleSearch, handleSearchInputChange, handleSearchKeyPress) ...
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
                }
            };
            const res = await axios.get('/api/admin/instructors-management', config);
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
    }, [token, currentPage]);

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
    
    const handleEdit = (instructor) => {
        setEditingInstructor(instructor);
        setShowEditModal(true);
    };

    // --- 3. SỬA LẠI HÀM XÓA ---
    // Hàm này chỉ mở modal
    const handleDelete = (instructorId) => {
        setDeletingInstructorId(instructorId);
        setShowDeleteModal(true);
    };

    // Hàm này thực hiện logic xóa
    const confirmDelete = async () => {
        if (!deletingInstructorId) return;
        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            await axios.delete(`/api/admin/instructors-management/${deletingInstructorId}`, config);
            fetchInstructors(currentPage, searchTerm); // Tải lại trang hiện tại
        } catch (err) {
            setError(err.response?.data?.msg || 'Xóa giảng viên thất bại.');
        } finally {
            setShowDeleteModal(false);
            setDeletingInstructorId(null);
        }
    };
    // ----------------------------

    return (
        <>
            {/* Thanh công cụ (Giữ nguyên) */}
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

            {/* Thông tin tổng số và loading (Giữ nguyên) */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                 <small className="text-muted">Hiển thị {instructors.length} trên tổng số {totalItems} giảng viên</small>
                 {loading && <Spinner animation="border" size="sm" />}
            </div>

            {/* Bảng dữ liệu (Giữ nguyên) */}
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
                                    {/* 4. Sửa nút Xóa để gọi hàm mới */}
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

            {/* Phân trang (Giữ nguyên) */}
            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            {/* Modals (Giữ nguyên) */}
            <AddInstructorModal show={showAddModal} handleClose={() => setShowAddModal(false)} onInstructorAdded={() => fetchInstructors(1)} />
            <EditInstructorModal show={showEditModal} handleClose={() => setShowEditModal(false)} instructor={editingInstructor} onInstructorUpdated={() => fetchInstructors(currentPage, searchTerm)} />
        
            {/* 5. THÊM MODAL XÁC NHẬN VÀO CUỐI */}
            <ConfirmDeleteModal
                show={showDeleteModal}
                handleClose={() => setShowDeleteModal(false)}
                handleConfirm={confirmDelete}
                title="Xác nhận Xóa Giảng viên"
                message={`Bạn có chắc chắn muốn xóa giảng viên ID: ${deletingInstructorId}? Các khóa học của họ sẽ không bị xóa nhưng cần được gán lại.`}
            />
        </>
    );
};

export default InstructorManagementTab;