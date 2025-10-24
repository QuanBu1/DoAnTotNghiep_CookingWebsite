// src/components/ReplyMessageModal.js
import React, { useState, useEffect, useContext } from 'react';
import { Modal, Button, Form, Alert, Spinner, Card } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';

const ReplyMessageModal = ({ show, handleClose, messageId, onReplied }) => {
    const [originalMessage, setOriginalMessage] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    useEffect(() => {
        if (show && messageId) {
            const fetchMessage = async () => {
                setLoading(true);
                setError('');
                try {
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    const res = await axios.get(`/api/admin/messages/${messageId}`, config);
                    setOriginalMessage(res.data);
                } catch (err) {
                    setError('Không thể tải nội dung tin nhắn.');
                } finally {
                    setLoading(false);
                }
            };
            fetchMessage();
        }
    }, [show, messageId, token]);

    const handleSendReply = async () => {
        if (!replyContent.trim()) {
            toast.error("Vui lòng nhập nội dung phản hồi.");
            return;
        }
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`/api/admin/messages/${messageId}/reply`, { replyContent }, config);
            toast.success("Gửi phản hồi thành công!");
            onReplied(); // Gọi hàm để làm mới danh sách
            handleClose(); // Đóng modal
        } catch (err) {
            toast.error("Gửi phản hồi thất bại.");
        } finally {
            setLoading(false);
        }
    };
    
    // Reset state khi modal đóng
    const handleExited = () => {
        setOriginalMessage(null);
        setReplyContent('');
        setError('');
    };

    return (
        <Modal show={show} onHide={handleClose} onExited={handleExited} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Phản hồi tin nhắn</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading && !originalMessage && <div className="text-center"><Spinner animation="border" /></div>}
                {error && <Alert variant="danger">{error}</Alert>}
                {originalMessage && (
                    <>
                        <Card className="mb-4 bg-light">
                            <Card.Body>
                                <Card.Title>Tin nhắn gốc</Card.Title>
                                <p><strong>Từ:</strong> {originalMessage.sender_name} ({originalMessage.sender_email})</p>
                                <p><strong>Chủ đề:</strong> {originalMessage.subject}</p>
                                <hr />
                                <p style={{ whiteSpace: 'pre-wrap' }}>{originalMessage.message}</p>
                            </Card.Body>
                        </Card>
                        <Form.Group>
                            <Form.Label className="fw-bold">Nội dung phản hồi của bạn:</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={7}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Nhập nội dung phản hồi tại đây..."
                            />
                        </Form.Group>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Hủy
                </Button>
                <Button variant="primary" onClick={handleSendReply} disabled={loading || !originalMessage}>
                    {loading ? <Spinner as="span" size="sm" /> : 'Gửi Phản hồi'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ReplyMessageModal;