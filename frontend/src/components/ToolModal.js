// src/components/ToolModal.js

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
// *** THÊM IMPORT CHO CKEDITOR 5 ***
import { CKEditor } from '@ckeditor/ckeditor5-react'; 
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'; // Sử dụng Classic Build
// *** KẾT THÚC IMPORT CKEDITOR ***

// Đổi tên prop 'tool' thành 'currentTool' để giữ nguyên fix lỗi TDZ
const ToolModal = ({ show, handleClose, tool: currentTool, onSave }) => {
    
    // ... (Khởi tạo formData, error giữ nguyên)
    const [formData, setFormData] = useState({ 
        name: '', 
        description: '', 
        image_url: '', 
        purchase_link: '', 
        price: '',
        features: '',       
        long_description: '' // Nội dung HTML
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            if (currentTool) {
                setFormData({
                    name: currentTool.name || '',
                    description: currentTool.description || '', 
                    image_url: currentTool.image_url || '',
                    purchase_link: currentTool.purchase_link || '',
                    price: currentTool.price || '',
                    features: currentTool.features || '', 
                    long_description: currentTool.long_description || ''
                });
            } else {
                setFormData({ name: '', description: '', image_url: '', purchase_link: '', price: '', features: '', long_description: '' });
            }
            setError(''); 
        }
    }, [currentTool, show]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // HÀM XỬ LÝ CHO CKEDITOR
    const handleCKEditorChange = (event, editor) => {
        const data = editor.getData(); // CKEditor trả về nội dung HTML qua getData()
        setFormData(prev => ({ ...prev, long_description: data }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            
            const submissionData = {
                name: formData.name,
                description: formData.description,
                image_url: formData.image_url,
                purchase_link: formData.purchase_link,
                price: formData.price,
                features: formData.features,
                long_description: formData.long_description // Gửi nội dung HTML
            };

            if (currentTool) { 
                await axios.put(`/api/tools/${currentTool.id}`, submissionData, config); 
            } else {
                await axios.post('/api/tools', submissionData, config); 
            }
            onSave();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.msg || "Thao tác thất bại.");
        }
    };
    
    // Đã xóa: Cấu hình modules cho Quill

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{currentTool ? 'Chỉnh sửa Dụng cụ' : 'Thêm Dụng cụ mới'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3"><Form.Label>Tên Dụng cụ</Form.Label><Form.Control type="text" name="name" value={formData.name || ''} onChange={onChange} required /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>Giá (VND)</Form.Label><Form.Control type="number" name="price" value={formData.price || ''} onChange={onChange} /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>URL Ảnh đại diện</Form.Label><Form.Control type="text" name="image_url" value={formData.image_url || ''} onChange={onChange} /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>Link mua hàng</Form.Label><Form.Control type="text" name="purchase_link" value={formData.purchase_link || ''} onChange={onChange} /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>Mô tả ngắn</Form.Label><Form.Control as="textarea" rows={3} name="description" value={formData.description || ''} onChange={onChange} /></Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Thông số kỹ thuật (Mỗi thông số 1 dòng)</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={5} 
                                    name="features" 
                                    value={formData.features || ''} 
                                    onChange={onChange}
                                    placeholder="VD: Dung tích: 1.8 Lít&#10;Công suất: 900W&#10;Lòng nồi: Chống dính Ceramic"
                                />
                                <Form.Text className="text-muted">Mỗi dòng sẽ là một gạch đầu dòng.</Form.Text>
                            </Form.Group>

                            {/* === CKEDITOR 5 CHO MÔ TẢ DÀI === */}
                            <Form.Group className="mb-3">
                                <Form.Label>Thông tin chi tiết (Chức năng Word)</Form.Label>
                                <CKEditor
                                    editor={ClassicEditor}
                                    data={formData.long_description || ''} // Dữ liệu đầu vào
                                    onChange={handleCKEditorChange} 
                                    config={{ 
                                         // Tùy chỉnh chiều cao để nó trông đẹp hơn trong Modal
                                         height: 200, 
                                         toolbar: [ // Thêm các nút cơ bản
                                            'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|', 'undo', 'redo'
                                        ]
                                    }} 
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    <div className="d-grid mt-3">
                        <Button variant="primary" type="submit">Lưu</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default ToolModal;