import React, { useState, useEffect, useContext } from 'react';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const EditCoursePage = () => {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        level: 'cơ bản',
        cuisine: '',
        cooking_style: '',
        price: '',
        image_url: '',
        live_embed_url: '' // Thêm trường mới vào state
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/courses/${id}`);
                // Đảm bảo formData được cập nhật với tất cả dữ liệu, kể cả link live (nếu có)
                setFormData(prevData => ({ ...prevData, ...res.data }));
            } catch (err) {
                setError('Không thể tải dữ liệu khóa học.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [id]);

    const { title, description, level, cuisine, cooking_style, price, image_url, live_embed_url } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            // formData giờ đã chứa live_embed_url và sẽ được gửi đi
            await axios.put(`/api/courses/${id}`, formData, config);
            alert('Cập nhật khóa học thành công!');
            navigate(`/courses/${id}`);
        } catch (err) {
            setError('Cập nhật thất bại. Vui lòng thử lại.');
        }
    };

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    
    const vietnameseCookingStyles = ["Kho", "Chiên", "Xào", "Nướng", "Hấp", "Lẩu", "Bánh các loại", "Cách chế biến khác"];

    return (
        <Container className="my-5">
            <Link to={`/courses/${id}`}>&larr; Hủy và Quay lại</Link>
            <h2 className="text-center">Chỉnh sửa Khóa học</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={onSubmit} className="p-4 border rounded shadow-sm mx-auto" style={{ maxWidth: '700px' }}>
                <Form.Group className="mb-3">
                    <Form.Label>Tên khóa học</Form.Label>
                    <Form.Control type="text" name="title" value={title || ''} onChange={onChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Mô tả</Form.Label>
                    <Form.Control as="textarea" rows={3} name="description" value={description || ''} onChange={onChange} required />
                </Form.Group>
                
                {/* === TRƯỜNG NHẬP LINK ĐÃ ĐƯỢC THÊM VÀO ĐÂY === */}
                <Form.Group className="mb-3">
                    <Form.Label>Link YouTube Livestream</Form.Label>
                    <Form.Control 
                        type="text" 
                        name="live_embed_url" 
                        value={live_embed_url || ''} 
                        onChange={onChange} 
                        placeholder="Dán link video YouTube đang live vào đây..."
                    />
                    <Form.Text className="text-muted">
                        Để trống nếu không có livestream.
                    </Form.Text>
                </Form.Group>
                <hr />

                <Form.Group className="mb-3">
                    <Form.Label>Cấp độ</Form.Label>
                    <Form.Select name="level" value={level || 'cơ bản'} onChange={onChange}>
                        <option value="cơ bản">Cơ bản</option>
                        <option value="nâng cao">Nâng cao</option>
                        <option value="chuyên nghiệp">Chuyên nghiệp</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Phong cách ẩm thực</Form.Label>
                    <Form.Control type="text" name="cuisine" value={cuisine || ''} onChange={onChange} required/>
                </Form.Group>
                
                {(cuisine || '').trim().toLowerCase() === 'việt' && (
                     <Form.Group className="mb-3">
                        <Form.Label>Phương pháp chế biến (Món Việt)</Form.Label>
                        <Form.Select name="cooking_style" value={cooking_style || ''} onChange={onChange}>
                            <option value="">-- Chọn phương pháp --</option>
                            {vietnameseCookingStyles.map(style => (
                                <option key={style} value={style}>{style}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                )}

                <Form.Group className="mb-3">
                    <Form.Label>Giá (VND)</Form.Label>
                    <Form.Control type="number" name="price" value={price || ''} onChange={onChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>URL Ảnh đại diện</Form.Label>
                    <Form.Control type="text" name="image_url" value={image_url || ''} onChange={onChange} required />
                </Form.Group>
                <div className="d-grid">
                    <Button variant="primary" type="submit">Lưu thay đổi</Button>
                </div>
            </Form>
        </Container>
    );
};

export default EditCoursePage;