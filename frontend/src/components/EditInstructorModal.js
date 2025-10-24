// src/components/EditInstructorModal.js

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const EditInstructorModal = ({ show, handleClose, instructor, onInstructorUpdated }) => {
    const [formData, setFormData] = useState({ fullName: '', email: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        if (instructor) {
            setFormData({ fullName: instructor.full_name || '', email: instructor.email || '' });
        }
    }, [instructor]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/admin/instructors-management/${instructor.id}`, formData, config);
            onInstructorUpdated();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.msg || 'Cập nhật thất bại.');
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton><Modal.Title>Chỉnh sửa thông tin giảng viên</Modal.Title></Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Họ và Tên</Form.Label>
                        <Form.Control type="text" name="fullName" value={formData.fullName} onChange={onChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" name="email" value={formData.email} onChange={onChange} required />
                    </Form.Group>
                    <Button variant="primary" type="submit">Lưu thay đổi</Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default EditInstructorModal;