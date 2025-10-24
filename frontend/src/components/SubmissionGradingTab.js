// src/components/SubmissionGradingTab.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Table, Button, Alert, Spinner, Modal, Form, Badge, Image } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const GradeModal = ({ show, handleClose, submission, onGraded }) => {
    const { token } = useContext(AuthContext);
    const [feedback, setFeedback] = useState('');
    const [status, setStatus] = useState('approved');

    useEffect(() => {
        if (submission) {
            setFeedback(submission.instructor_feedback || '');
            setStatus(submission.status === 'pending' ? 'approved' : submission.status);
        }
    }, [submission]);

    const handleSubmit = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const body = { status, feedback };
            await axios.put(`/api/instructor/submissions/${submission.id}/grade`, body, config);
            toast.success("Chấm bài thành công!");
            onGraded();
            handleClose();
        } catch (err) {
            toast.error("Chấm bài thất bại.");
        }
    };

    if (!submission) return null;

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Chấm bài: {submission.lesson_title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h5>Học viên: {submission.student_name}</h5>
                <p><strong>Khóa học:</strong> {submission.course_title}</p>
                <p><strong>Lời nhắn:</strong> {submission.student_comment || "Không có"}</p>
                <Image src={submission.image_url} fluid rounded className="mb-3" />
                <Form.Group className="mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="approved">Đạt (Approved)</option>
                        <option value="rejected">Cần làm lại (Rejected)</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group>
                    <Form.Label>Nhận xét của bạn</Form.Label>
                    <Form.Control as="textarea" rows={4} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Hãy đưa ra nhận xét chi tiết..." />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Hủy</Button>
                <Button variant="primary" onClick={handleSubmit}>Lưu điểm</Button>
            </Modal.Footer>
        </Modal>
    );
};

const SubmissionGradingTab = () => {
    const { token } = useContext(AuthContext);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('/api/instructor/submissions', config);
            setSubmissions(res.data);
        } catch (err) {
            setError('Không thể tải danh sách bài nộp.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    // HÀM MỚI: Helper để hiển thị badge trạng thái
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <Badge bg="warning">Chờ chấm</Badge>;
            case 'approved':
                return <Badge bg="success">Đạt</Badge>;
            case 'rejected':
                return <Badge bg="danger">Cần làm lại</Badge>;
            default:
                return <Badge bg="secondary">Không rõ</Badge>;
        }
    };

    if (loading) return <div className="text-center p-4"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            {submissions.length === 0 ? (
                <Alert variant="info">Chưa có bài nộp nào.</Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Học viên</th>
                            <th>Bài học</th>
                            <th>Khóa học</th>
                            <th>Ngày nộp</th>
                            <th>Trạng thái</th> {/* <-- THÊM CỘT MỚI */}
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.map(sub => (
                            <tr key={sub.id} className={sub.status === 'pending' ? 'table-warning' : ''}>
                                <td>{sub.student_name}</td>
                                <td>{sub.lesson_title}</td>
                                <td>{sub.course_title}</td>
                                <td>{new Date(sub.submitted_at).toLocaleString('vi-VN')}</td>
                                <td>{getStatusBadge(sub.status)}</td> {/* <-- HIỂN THỊ TRẠNG THÁI */}
                                <td>
                                    <Button variant="primary" size="sm" onClick={() => { setSelectedSubmission(sub); setShowModal(true); }}>
                                        {sub.status === 'pending' ? 'Chấm bài' : 'Xem lại'}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
            <GradeModal 
                show={showModal}
                handleClose={() => setShowModal(false)}
                submission={selectedSubmission}
                onGraded={fetchSubmissions}
            />
        </>
    );
};

export default SubmissionGradingTab;