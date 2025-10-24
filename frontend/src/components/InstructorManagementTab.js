// src/components/InstructorManagementTab.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, ButtonGroup } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import AddInstructorModal from './AddInstructorModal';
import EditInstructorModal from './EditInstructorModal';

const InstructorManagementTab = () => {
    const [instructors, setInstructors] = useState([]);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingInstructor, setEditingInstructor] = useState(null);

    const fetchInstructors = useCallback(async () => {
        try {
            setError('');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/admin/instructors-management', config);
            setInstructors(res.data);
        } catch (err) {
            setError('Không thể tải danh sách giảng viên.');
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchInstructors();
    }, [token, fetchInstructors]);

    const handleEdit = (instructor) => {
        setEditingInstructor(instructor);
        setShowEditModal(true);
    };

    const handleDelete = async (instructorId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa giảng viên này? Hành động này không thể hoàn tác.')) {
            try {
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                await axios.delete(`http://localhost:5000/api/admin/instructors-management/${instructorId}`, config);
                fetchInstructors();
            } catch (err) {
                setError(err.response?.data?.msg || 'Xóa giảng viên thất bại.');
            }
        }
    };

    return (
        <>
            <div className="d-flex justify-content-end mb-3">
                <Button variant="primary" onClick={() => setShowAddModal(true)}>+ Thêm giảng viên</Button>
            </div>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
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
                    {instructors.map(instructor => (
                        <tr key={instructor.id}>
                            <td>{instructor.id}</td>
                            <td>{instructor.full_name}</td>
                            <td>{instructor.email}</td>
                            <td>{new Date(instructor.created_at).toLocaleDateString('vi-VN')}</td>
                            <td>
                                <ButtonGroup>
                                    <Button variant="outline-primary" size="sm" onClick={() => handleEdit(instructor)}>Sửa</Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(instructor.id)}>Xóa</Button>
                                </ButtonGroup>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <AddInstructorModal show={showAddModal} handleClose={() => setShowAddModal(false)} onInstructorAdded={fetchInstructors} />
            <EditInstructorModal show={showEditModal} handleClose={() => setShowEditModal(false)} instructor={editingInstructor} onInstructorUpdated={fetchInstructors} />
        </>
    );
};

export default InstructorManagementTab;