import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const EditUserModal = ({ show, handleClose, userId, onUserUpdated }) => {
    const [formData, setFormData] = useState({ full_name: '', email: '', role: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        // Chỉ fetch dữ liệu khi modal được mở và có userId
        if (show && userId) {
            const fetchUser = async () => {
                setError('');
                try {
                    const token = localStorage.getItem('token');
                    const config = { headers: { 'Authorization': `Bearer ${token}` } };
                    const res = await axios.get(`http://localhost:5000/api/admin/users/${userId}`, config);
                    setFormData(res.data);
                } catch (err) {
                    setError('Không thể tải dữ liệu người dùng.');
                }
            };
            fetchUser();
        }
    }, [show, userId]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            // Dữ liệu gửi đi cần khớp với backend (fullName, email, role)
            const body = {
                fullName: formData.full_name,
                email: formData.email,
                role: formData.role
            };
            await axios.put(`http://localhost:5000/api/admin/users/${userId}`, body, config);
            onUserUpdated(); // Gọi hàm để tải lại danh sách
            handleClose();   // Đóng modal
        } catch (err) {
            setError(err.response?.data?.msg || 'Cập nhật thất bại.');
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton><Modal.Title>Chỉnh sửa người dùng</Modal.Title></Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Họ và Tên</Form.Label>
                        <Form.Control type="text" name="full_name" value={formData.full_name || ''} onChange={onChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" name="email" value={formData.email || ''} onChange={onChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Vai trò</Form.Label>
                        <Form.Select name="role" value={formData.role || ''} onChange={onChange}>
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Admin</option>
                        </Form.Select>
                    </Form.Group>
                    <Button variant="primary" type="submit">Lưu thay đổi</Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default EditUserModal;