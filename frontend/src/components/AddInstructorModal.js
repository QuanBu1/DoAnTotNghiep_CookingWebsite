// src/components/AddInstructorModal.js

import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const AddInstructorModal = ({ show, handleClose, onInstructorAdded }) => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [error, setError] = useState('');

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            await axios.post('http://localhost:5000/api/admin/instructors-management', formData, config);
            onInstructorAdded();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.msg || 'Thêm giảng viên thất bại.');
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton><Modal.Title>Thêm giảng viên mới</Modal.Title></Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Họ và Tên</Form.Label>
                        <Form.Control type="text" name="fullName" onChange={onChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" name="email" onChange={onChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Mật khẩu</Form.Label>
                        <Form.Control type="password" name="password" onChange={onChange} required minLength="6" />
                    </Form.Group>
                    <Button variant="primary" type="submit">Thêm mới</Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddInstructorModal;