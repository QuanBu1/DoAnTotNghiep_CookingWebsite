// src/pages/AddCoursePage.js
import React, { useState, useContext } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const AddCoursePage = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        level: 'cơ bản',
        cuisine: '',
        cooking_style: '',
        price: '',
        image_url: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const { title, description, level, cuisine, cooking_style, price, image_url } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        try {
            const res = await axios.post('http://localhost:5000/api/courses', formData, config);
            navigate(`/courses/${res.data.id}`);
        } catch (err) {
            setError(err.response.data.msg || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
        }
    };
    
    // --- THÊM "BÁNH CÁC LOẠI" VÀO ĐÂY ---
    const vietnameseCookingStyles = ["Kho", "Chiên", "Xào", "Nướng", "Hấp", "Lẩu", "Bánh các loại", "Cách chế biến khác"];

    return (
        <Container className="mt-5">
            <h2 className="text-center">Tạo Khóa học mới</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={onSubmit} className="p-4 border rounded shadow-sm mx-auto" style={{ maxWidth: '700px' }}>
                <Form.Group className="mb-3">
                    <Form.Label>Tên khóa học</Form.Label>
                    <Form.Control type="text" name="title" value={title} onChange={onChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Mô tả</Form.Label>
                    <Form.Control as="textarea" rows={3} name="description" value={description} onChange={onChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Cấp độ</Form.Label>
                    <Form.Select name="level" value={level} onChange={onChange}>
                        <option value="cơ bản">Cơ bản</option>
                        <option value="nâng cao">Nâng cao</option>
                        <option value="chuyên nghiệp">Chuyên nghiệp</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Phong cách ẩm thực</Form.Label>
                    <Form.Control type="text" name="cuisine" value={cuisine} onChange={onChange} placeholder="Ví dụ: Việt, Âu, Á..." required/>
                </Form.Group>
                
                {cuisine.trim().toLowerCase() === 'việt' && (
                    <Form.Group className="mb-3">
                        <Form.Label>Phương pháp chế biến (Món Việt)</Form.Label>
                        <Form.Select name="cooking_style" value={cooking_style} onChange={onChange}>
                            <option value="">-- Chọn phương pháp --</option>
                            {vietnameseCookingStyles.map(style => (
                                <option key={style} value={style}>{style}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                )}

                <Form.Group className="mb-3">
                    <Form.Label>Giá (VND)</Form.Label>
                    <Form.Control type="number" name="price" value={price} onChange={onChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>URL Ảnh đại diện</Form.Label>
                    <Form.Control type="text" name="image_url" value={image_url} onChange={onChange} required />
                </Form.Group>
                <div className="d-grid">
                    <Button variant="primary" type="submit">Tạo khóa học</Button>
                </div>
            </Form>
        </Container>
    );
};

export default AddCoursePage;