// src/components/UserManagementTab.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, ButtonGroup } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';

const UserManagementTab = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            setError('');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/admin/users', config);
            setUsers(res.data);
        } catch (err) {
            setError('Không thể tải danh sách người dùng.');
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchUsers();
    }, [token, fetchUsers]);

    const handleEdit = (userId) => {
        setEditingUserId(userId);
        setShowEditModal(true);
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            try {
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, config);
                fetchUsers();
            } catch (err) {
                setError('Xóa người dùng thất bại.');
            }
        }
    };

    return (
        <>
            <div className="d-flex justify-content-end mb-3">
                <Button variant="primary" onClick={() => setShowAddModal(true)}>+ Thêm người dùng</Button>
            </div>
            {error && <Alert variant="danger">{error}</Alert>}
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
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.full_name}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                            <td>
                                <ButtonGroup>
                                    <Button variant="outline-primary" size="sm" onClick={() => handleEdit(user.id)}>Sửa</Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(user.id)}>Xóa</Button>
                                </ButtonGroup>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <AddUserModal show={showAddModal} handleClose={() => setShowAddModal(false)} onUserAdded={fetchUsers} />
            <EditUserModal show={showEditModal} handleClose={() => setShowEditModal(false)} userId={editingUserId} onUserUpdated={fetchUsers} />
        </>
    );
};

export default UserManagementTab;