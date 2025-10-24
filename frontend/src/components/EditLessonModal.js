import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const EditLessonModal = ({ show, handleClose, courseId, lesson, onLessonUpdated }) => {
    // Giữ nguyên state
    const [formData, setFormData] = useState({ title: '', video_url: '', content: '', image_urls: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // === PHẦN SỬA LỖI NẰM Ở ĐÂY ===
    // useEffect này sẽ tự động chạy mỗi khi cửa sổ được mở (show = true)
    useEffect(() => {
        // Chỉ fetch dữ liệu khi modal được mở và có thông tin bài học
        if (show && lesson) {
            const fetchFullLessonData = async () => {
                setLoading(true);
                setError('');
                try {
                    const token = localStorage.getItem('token');
                    const config = { headers: { 'Authorization': `Bearer ${token}` } };
                    // Gọi API để lấy dữ liệu ĐẦY ĐỦ của bài học, bao gồm cả danh sách ảnh
                    const res = await axios.get(`http://localhost:5000/api/lessons/${courseId}/${lesson.id}`, config);
                    
                    const fullLesson = res.data;
                    
                    // Chuyển mảng ảnh trả về từ API thành chuỗi, mỗi ảnh một dòng
                    const imageUrlsString = fullLesson.images ? fullLesson.images.map(img => img.image_url).join('\n') : '';
                    
                    // Cập nhật form với dữ liệu mới và đầy đủ nhất
                    setFormData({
                        title: fullLesson.title || '',
                        video_url: fullLesson.video_url || '',
                        content: fullLesson.content || '',
                        image_urls: imageUrlsString
                    });

                } catch (err) {
                    setError('Không thể tải dữ liệu đầy đủ của bài học.');
                } finally {
                    setLoading(false);
                }
            };
            fetchFullLessonData();
        }
    }, [show, lesson, courseId]); // Dependency array
    
    const { title, video_url, content, image_urls } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Hàm handleSubmit không có gì thay đổi
    const handleSubmit = async (e) => {
        e.preventDefault();
        const imagesArray = image_urls.split('\n').filter(url => url.trim() !== '');
        const submissionData = { ...formData, image_urls: imagesArray };
        
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            // API endpoint để cập nhật đã đúng
            await axios.put(`http://localhost:5000/api/lessons/${courseId}/${lesson.id}`, submissionData, config);
            
            onLessonUpdated(); // Tải lại danh sách bài học ở trang chi tiết
            handleClose();     // Đóng modal
        } catch (err) {
            setError('Cập nhật bài học thất bại.');
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton><Modal.Title>Chỉnh sửa Bài học</Modal.Title></Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                
                {/* Lỗi nằm ở đây: Khối <Form> cần được bọc trong () */}
                {loading ? <p>Đang tải dữ liệu...</p> : (
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Tiêu đề bài học</Form.Label>
                            <Form.Control type="text" name="title" value={title} onChange={onChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>URL Video</Form.Label>
                            <Form.Control type="text" name="video_url" value={video_url} onChange={onChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>URL Ảnh (Mỗi link một dòng)</Form.Label>
                            <Form.Control as="textarea" rows={4} name="image_urls" value={image_urls} onChange={onChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nội dung / Công thức</Form.Label>
                            <Form.Control as="textarea" rows={10} name="content" value={content} onChange={onChange} required />
                            <Form.Text className="text-muted">
                                Dùng cú pháp Markdown để định dạng: <code>**Chữ đậm**</code>, <code># Tiêu đề lớn</code>, <code>## Tiêu đề vừa</code>.
                            </Form.Text>
                        </Form.Group>
                        <Button variant="primary" type="submit">Lưu thay đổi</Button>
                    </Form>
                )}
                {/* Dấu ngoặc đơn kết thúc ở đây */}
                
            </Modal.Body>
        </Modal>
    );
};

export default EditLessonModal;