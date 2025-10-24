// src/components/SubmissionTab.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Form, Button, Alert, Card, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const SubmissionTab = ({ courseId, lessonId, userId }) => {
    const { token } = useContext(AuthContext);
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageUrl, setImageUrl] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // Thêm state cho lúc nộp bài

    // SỬA ĐỔI: Hàm này giờ sẽ gọi API thật để lấy bài nộp
    const fetchSubmission = useCallback(async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`/api/lessons/${courseId}/${lessonId}/submission`, config);
            setSubmission(res.data); // Nếu tìm thấy, lưu vào state
        } catch (err) {
            if (err.response && err.response.status === 404) {
                // Lỗi 404 có nghĩa là chưa nộp bài, đây là trường hợp bình thường
                setSubmission(null);
            } else {
                toast.error("Không thể tải trạng thái bài nộp.");
            }
        } finally {
            setLoading(false);
        }
    }, [courseId, lessonId, token]);

    useEffect(() => {
        fetchSubmission();
    }, [fetchSubmission]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const body = { imageUrl, studentComment: comment };
            const res = await axios.post(`/api/lessons/${courseId}/${lessonId}/submit`, body, config);
            setSubmission(res.data);
            toast.success("Nộp bài thành công! Vui lòng chờ giảng viên chấm bài.");
        } catch (err) {
            toast.error(err.response?.data?.msg || "Nộp bài thất bại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="text-center p-4"><Spinner animation="border" /></div>;

    // Giao diện khi đã có bài nộp
    if (submission) {
        return (
            <Card className="mt-3">
                <Card.Header as="h5">Bài thực hành của bạn</Card.Header>
                <Card.Body>
                    <div className="text-center mb-3">
                        <img src={submission.image_url} alt="Bài nộp" className="img-fluid rounded shadow-sm" style={{ maxHeight: '400px' }} />
                    </div>
                    <p><strong>Lời nhắn của bạn:</strong> {submission.student_comment || "Không có"}</p>
                    <p><strong>Ngày nộp:</strong> {new Date(submission.submitted_at).toLocaleString('vi-VN')}</p>
                    <hr />
                    <h5>Kết quả</h5>
                    <p>
                        <strong>Trạng thái: </strong> 
                        <Badge 
                            bg={submission.status === 'approved' ? 'success' : submission.status === 'rejected' ? 'danger' : 'warning'}
                            className="fs-6"
                        >
                            {submission.status === 'approved' ? 'Đạt' : submission.status === 'rejected' ? 'Cần làm lại' : 'Chờ chấm'}
                        </Badge>
                    </p>
                    {submission.instructor_feedback && (
                        <Alert variant="info">
                            <Alert.Heading>Nhận xét của giảng viên:</Alert.Heading>
                            <p className="mb-0">{submission.instructor_feedback}</p>
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        );
    }

    // Giao diện khi chưa nộp bài
    return (
        <Card className="mt-3">
            <Card.Body>
                <p>Hoàn thành món ăn? Hãy chụp ảnh và nộp bài để giảng viên nhận xét nhé!</p>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>URL Hình ảnh sản phẩm</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Dán link ảnh bạn đã upload (ví dụ: Imgur, Cloudinary)" 
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Lời nhắn cho giảng viên (tùy chọn)</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </Form.Group>
                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : 'Nộp bài'}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default SubmissionTab;