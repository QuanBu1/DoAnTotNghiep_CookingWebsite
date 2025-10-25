// src/components/UserManagementTab.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, ButtonGroup, Form, InputGroup, Row, Col, Spinner } from 'react-bootstrap'; // Thêm Form, InputGroup, Row, Col, Spinner
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import AdminPagination from './AdminPagination'; // Import component phân trang

const UserManagementTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true); // Thêm state loading
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    // State cho modal (giữ nguyên)
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    // State cho tìm kiếm, lọc và phân trang
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all'); // 'all', 'student', 'instructor', 'admin'
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0); // Thêm tổng số items
    const [limit] = useState(10); // Số lượng item mỗi trang

    // useCallback để tránh tạo lại hàm fetchUsers mỗi lần render
    const fetchUsers = useCallback(async (page = 1, search = searchTerm, filter = filterRole) => {
        setLoading(true); // Bắt đầu loading
        try {
            setError('');
            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { // Gửi các tham số qua query params
                    page,
                    limit,
                    search: search.trim(),
                    filter: filter
                }
            };
            const res = await axios.get('/api/admin/users', config); // API đã cập nhật ở backend
            setUsers(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
            setCurrentPage(res.data.pagination.currentPage);
            setTotalItems(res.data.pagination.totalItems); // Lưu tổng số users
        } catch (err) {
            setError('Không thể tải danh sách người dùng.');
            setUsers([]); // Reset data khi lỗi
            setTotalPages(1);
            setCurrentPage(1);
            setTotalItems(0);
        } finally {
            setLoading(false); // Kết thúc loading
        }
    }, [token, limit, searchTerm, filterRole]); // Thêm searchTerm, filterRole vào dependencies

    // useEffect để gọi fetchUsers khi component mount hoặc các state dependency thay đổi
    useEffect(() => {
        if (token) {
            fetchUsers(currentPage, searchTerm, filterRole);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, currentPage, filterRole]); // Bỏ fetchUsers ra vì nó đã dùng useCallback

    // Handler cho thay đổi trang
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        // fetchUsers sẽ tự động được gọi lại do currentPage thay đổi trong useEffect
    };

    // Handler cho tìm kiếm (khi nhấn Enter hoặc nút Tìm)
    const handleSearch = () => {
        setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
        fetchUsers(1, searchTerm, filterRole); // Gọi fetch với từ khóa mới
    };

    // Handler cho thay đổi bộ lọc
    const handleFilterChange = (e) => {
        setFilterRole(e.target.value);
        setCurrentPage(1); // Reset về trang 1 khi lọc
        // fetchUsers sẽ tự động được gọi lại do filterRole thay đổi trong useEffect
    };

    // Handler cho input tìm kiếm (chỉ cập nhật state, không gọi API ngay)
    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };
    // Xử lý khi nhấn Enter trong ô tìm kiếm
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Các hàm xử lý modal giữ nguyên
    const handleEdit = (userId) => {
        setEditingUserId(userId);
        setShowEditModal(true);
    };

    const handleDelete = async (userId) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng ID: ${userId}?`)) {
            try {
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                await axios.delete(`/api/admin/users/${userId}`, config);
                // Tải lại trang hiện tại sau khi xóa
                fetchUsers(currentPage, searchTerm, filterRole);
            } catch (err) {
                setError(err.response?.data?.msg || 'Xóa người dùng thất bại.');
            }
        }
    };

    return (
        <>
            {/* Thanh công cụ: Thêm mới, Lọc, Tìm kiếm */}
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
                            onKeyPress={handleSearchKeyPress} // Thêm xử lý Enter
                        />
                        <Button variant="outline-secondary" onClick={handleSearch}>
                            <i className="bi bi-search"></i> Tìm
                        </Button>
                    </InputGroup>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Hiển thị thông tin tổng số và loading */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted">Hiển thị {users.length} trên tổng số {totalItems} người dùng</small>
                {loading && <Spinner animation="border" size="sm" />}
            </div>

            {/* Bảng dữ liệu */}
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
                    {/* Chỉ hiển thị khi không loading và có dữ liệu */}
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
                                    <Button variant="outline-danger" onClick={() => handleDelete(user.id)} title="Xóa"><i className="bi bi-trash-fill"></i></Button>
                                </ButtonGroup>
                            </td>
                        </tr>
                    ))}
                    {/* Hiển thị khi loading */}
                    {loading && (
                        <tr>
                            <td colSpan="6" className="text-center">
                                <Spinner animation="border" size="sm" /> Đang tải...
                            </td>
                        </tr>
                    )}
                    {/* Hiển thị khi không có kết quả */}
                    {!loading && users.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center text-muted">Không tìm thấy người dùng nào.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            {/* Component Phân trang */}
            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            {/* Modals (giữ nguyên) */}
            <AddUserModal show={showAddModal} handleClose={() => setShowAddModal(false)} onUserAdded={() => fetchUsers(1)} />
            <EditUserModal show={showEditModal} handleClose={() => setShowEditModal(false)} userId={editingUserId} onUserUpdated={() => fetchUsers(currentPage, searchTerm, filterRole)} />
        </>
    );
};

export default UserManagementTab;