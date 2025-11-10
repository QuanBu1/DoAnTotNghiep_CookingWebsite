// src/components/UserManagementTab.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, ButtonGroup, Form, InputGroup, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import AdminPagination from './AdminPagination';
import ConfirmDeleteModal from './ConfirmDeleteModal'; // <-- 1. IMPORT MODAL MỚI

const UserManagementTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    // State cho modal (giữ nguyên)
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    // --- 2. THÊM STATE CHO MODAL XÓA ---
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState(null);
    // ------------------------------------

    // State cho tìm kiếm, lọc và phân trang (giữ nguyên)
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(10);

    const fetchUsers = useCallback(async (page = 1, search = searchTerm, filter = filterRole) => {
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
            const res = await axios.get('/api/admin/users', config); 
            setUsers(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
            setCurrentPage(res.data.pagination.currentPage);
            setTotalItems(res.data.pagination.totalItems); 
        } catch (err) {
            setError('Không thể tải danh sách người dùng.');
            setUsers([]); 
            setTotalPages(1);
            setCurrentPage(1);
            setTotalItems(0);
        } finally {
            setLoading(false); 
        }
    }, [token, limit, searchTerm, filterRole]); 

    useEffect(() => {
        if (token) {
            fetchUsers(currentPage, searchTerm, filterRole);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, currentPage, filterRole]); 

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearch = () => {
        setCurrentPage(1); 
        fetchUsers(1, searchTerm, filterRole); 
    };

    const handleFilterChange = (e) => {
        setFilterRole(e.target.value);
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
    
    const handleEdit = (userId) => {
        setEditingUserId(userId);
        setShowEditModal(true);
    };


    // --- 3. SỬA LẠI HÀM XÓA ---
    // Hàm này chỉ mở modal
    const handleDelete = (userId) => {
        setDeletingUserId(userId); // Lưu ID của người dùng sẽ bị xóa
        setShowDeleteModal(true);   // Mở modal xác nhận
    };

    // Hàm này thực hiện logic xóa sau khi người dùng xác nhận
    const confirmDelete = async () => {
        if (!deletingUserId) return; // Kiểm tra an toàn

        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            await axios.delete(`/api/admin/users/${deletingUserId}`, config);
            // Tải lại trang hiện tại sau khi xóa
            fetchUsers(currentPage, searchTerm, filterRole);
        } catch (err) {
            setError(err.response?.data?.msg || 'Xóa người dùng thất bại.');
        } finally {
            setShowDeleteModal(false); // Đóng modal
            setDeletingUserId(null);   // Reset ID
        }
    };
    // ----------------------------

    return (
        <>
            {/* Thanh công cụ: Thêm mới, Lọc, Tìm kiếm (Giữ nguyên) */}
            <Row className="mb-3 g-2 align-items-center">
                <Col md="auto">
                    <Button variant="primary" onClick={() => setShowAddModal(true)}>+ Thêm người dùng</Button>
                </Col>
                <Col md={3}>
                    <Form.Group controlId="userFilterRole">
                        <Form.Select value={filterRole} onChange={handleFilterChange}>
                            <option value="all">Tất cả vai trò</option>
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Admin</option>
                        </Form.Select>
                    </Form.Group>
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

            {/* Hiển thị thông tin tổng số và loading (Giữ nguyên) */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted">Hiển thị {users.length} trên tổng số {totalItems} người dùng</small>
                {loading && <Spinner animation="border" size="sm" />}
            </div>

            {/* Bảng dữ liệu (Giữ nguyên) */}
            <Table striped bordered hover responsive>
                 <thead>
                    <tr>
                        <th>ID</th>
                        <th>Họ Tên</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {!loading && users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.full_name}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                            <td>
                                <ButtonGroup size="sm">
                                    <Button variant="outline-primary" onClick={() => handleEdit(user.id)} title="Sửa"><i className="bi bi-pencil-fill"></i></Button>
                                    {/* 4. Đảm bảo nút xóa gọi đúng hàm `handleDelete` mới */}
                                    <Button variant="outline-danger" onClick={() => handleDelete(user.id)} title="Xóa"><i className="bi bi-trash-fill"></i></Button>
                                </ButtonGroup>
                            </td>
                        </tr>
                    ))}
                    {loading && (
                        <tr>
                            <td colSpan="6" className="text-center">
                                <Spinner animation="border" size="sm" /> Đang tải...
                            </td>
                        </tr>
                    )}
                    {!loading && users.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center text-muted">Không tìm thấy người dùng nào.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            {/* Component Phân trang (Giữ nguyên) */}
            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            {/* Modals (giữ nguyên) */}
            <AddUserModal show={showAddModal} handleClose={() => setShowAddModal(false)} onUserAdded={() => fetchUsers(1)} />
            <EditUserModal show={showEditModal} handleClose={() => setShowEditModal(false)} userId={editingUserId} onUserUpdated={() => fetchUsers(currentPage, searchTerm, filterRole)} />
            
            {/* 5. THÊM MODAL XÁC NHẬN VÀO CUỐI */}
            <ConfirmDeleteModal
                show={showDeleteModal}
                handleClose={() => setShowDeleteModal(false)}
                handleConfirm={confirmDelete}
                title="Xác nhận Xóa Người dùng"
                message={`Bạn có chắc chắn muốn xóa vĩnh viễn người dùng ID: ${deletingUserId}? Mọi dữ liệu liên quan (khóa học, bình luận...) sẽ bị xóa.`}
            />
        </>
    );
};

export default UserManagementTab;