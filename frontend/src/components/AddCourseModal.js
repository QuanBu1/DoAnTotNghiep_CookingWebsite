// src/components/AddCourse-Modal.js

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';

// --- Hằng số được di chuyển ra ngoài component ---
// Điều này đảm bảo nó chỉ được tạo một lần và không gây ra cảnh báo phụ thuộc.
const initialFormState = { title: '', description: '', level: 'cơ bản', cuisine: '', price: '', image_url: '', instructor_id: '' };

const AddCourseModal = ({ show, handleClose, onCourseAdded }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [instructors, setInstructors] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            setError('');
            setFormData(initialFormState); // Reset form mỗi khi mở modal
            const fetchInstructors = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const config = { headers: { 'Authorization': `Bearer ${token}` } };
                    const res = await axios.get('http://localhost:5000/api/admin/instructors', config);
                    setInstructors(res.data);
                } catch (err) {
                    setError("Không thể tải danh sách giảng viên.");
                }
            };
            fetchInstructors();
        }
    }, [show]); // Bây giờ đã hoàn toàn chính xác và không còn cảnh báo.
    
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            await axios.post('http://localhost:5000/api/admin/courses', formData, config);
            onCourseAdded();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.msg || "Thêm khóa học thất bại.");
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton><Modal.Title>Thêm khóa học mới</Modal.Title></Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Tên khóa học</Form.Label>
                                <Form.Control type="text" name="title" value={formData.title} onChange={onChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                           <Form.Group className="mb-3">
                                <Form.Label>Giảng viên</Form.Label>
                                <Form.Select name="instructor_id" value={formData.instructor_id} onChange={onChange} required>
                                    <option value="">-- Chọn giảng viên --</option>
                                    {instructors.map(inst => <option key={inst.id} value={inst.id}>{inst.full_name}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Mô tả</Form.Label>
                        <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={onChange} required />
                    </Form.Group>
                    <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Cấp độ</Form.Label><Form.Select name="level" value={formData.level} onChange={onChange}><option value="cơ bản">Cơ bản</option><option value="nâng cao">Nâng cao</option><option value="chuyên nghiệp">Chuyên nghiệp</option></Form.Select></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Phong cách ẩm thực</Form.Label><Form.Control type="text" name="cuisine" value={formData.cuisine} onChange={onChange} /></Form.Group></Col>
                    </Row>
                     <Row>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>Giá (VND)</Form.Label><Form.Control type="number" name="price" value={formData.price} onChange={onChange} required /></Form.Group></Col>
                        <Col md={6}><Form.Group className="mb-3"><Form.Label>URL Ảnh đại diện</Form.Label><Form.Control type="text" name="image_url" value={formData.image_url} onChange={onChange} /></Form.Group></Col>
                    </Row>
                    <div className="d-flex justify-content-end">
                        <Button variant="primary" type="submit">Thêm mới</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddCourseModal;