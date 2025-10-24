import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const AddLessonModal = ({ show, handleClose, courseId, onLessonAdded }) => {
    const [formData, setFormData] = useState({
        title: '',
        video_url: '',
        content: '',
        image_urls: '' // Dùng một chuỗi để nhận dữ liệu từ textarea
    });
    const [error, setError] = useState('');

    const { title, video_url, content, image_urls } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Chuyển chuỗi các URL (mỗi link một dòng) thành một mảng, và loại bỏ các dòng trống
        const imagesArray = image_urls.split('\n').filter(url => url.trim() !== '');
        const submissionData = { ...formData, image_urls: imagesArray };

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };
            // Gửi dữ liệu (đã chứa mảng ảnh) lên backend
            await axios.post(`http://localhost:5000/api/courses/${courseId}/lessons`, submissionData, config);
            
            onLessonAdded(); // Gọi hàm để làm mới danh sách bài học ở trang cha
            handleClose();   // Đóng modal
            // Reset form về trạng thái ban đầu để chuẩn bị cho lần thêm tiếp theo
            setFormData({ title: '', video_url: '', content: '', image_urls: '' });

        } catch (err) {
            setError(err.response?.data?.msg || 'Đã xảy ra lỗi khi thêm bài học.');
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Thêm bài học mới</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Tiêu đề bài học</Form.Label>
                        <Form.Control type="text" name="title" value={title} onChange={onChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>URL Video (Tùy chọn)</Form.Label>
                        <Form.Control type="text" name="video_url" value={video_url} onChange={onChange} placeholder="Để trống nếu dùng ảnh minh họa" />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>URL Ảnh minh họa (Mỗi link một dòng)</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={4}
                            name="image_urls" 
                            value={image_urls} 
                            onChange={onChange} 
                            placeholder="Dán các link ảnh vào đây, mỗi link trên một dòng..." 
                        />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Nội dung / Công thức</Form.Label>
                        <Form.Control as="textarea" rows={10} name="content" value={content} onChange={onChange} required />
                        {/* Thêm dòng này để hướng dẫn */}
                        <Form.Text className="text-muted">
                            Để chèn ảnh vào nội dung, hãy đặt <code>[HINHANH_1]</code>, <code>[HINHANH_2]</code>,... vào vị trí bạn muốn.
                        </Form.Text>
                    </Form.Group>
                    <Button variant="primary" type="submit">Lưu bài học</Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddLessonModal;