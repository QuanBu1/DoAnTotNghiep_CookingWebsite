// src/components/MessageManagementTab.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Table, Alert, Spinner, Badge, Button } from 'react-bootstrap'; // THÊM Button
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import ReplyMessageModal from './ReplyMessageModal'; // IMPORT MODAL MỚI

const MessageManagementTab = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    // State cho modal
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState(null);

    const fetchMessages = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('/api/admin/messages', config);
            setMessages(res.data);
        } catch (err) {
            setError('Không thể tải danh sách tin nhắn.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchMessages();
    }, [token, fetchMessages]);
    
    const handleOpenReplyModal = (messageId) => {
        setSelectedMessageId(messageId);
        setShowReplyModal(true);
    };
    
    const handleCloseReplyModal = () => {
        setShowReplyModal(false);
        setSelectedMessageId(null);
    };

    if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Người gửi</th>
                        <th>Email</th>
                        <th>Chủ đề</th>
                        <th>Nội dung</th>
                        <th>Ngày gửi</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {messages.map((msg) => (
                        <tr key={msg.id}>
                            <td className={!msg.is_read ? 'fw-bold' : ''}>{msg.sender_name}</td>
                            <td>{msg.sender_email}</td>
                            <td>{msg.subject}</td>
                            <td style={{ minWidth: '300px', whiteSpace: 'pre-wrap' }}>{msg.message}</td>
                            <td>{new Date(msg.created_at).toLocaleString('vi-VN')}</td>
                            <td>
                                {msg.is_replied 
                                    ? <Badge bg="success">Đã trả lời</Badge> 
                                    : msg.is_read ? <Badge bg="secondary">Đã đọc</Badge> : <Badge bg="primary">Mới</Badge>
                                }
                            </td>
                            <td>
                                <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => handleOpenReplyModal(msg.id)}
                                >
                                    Phản hồi
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            
            <ReplyMessageModal
                show={showReplyModal}
                handleClose={handleCloseReplyModal}
                messageId={selectedMessageId}
                onReplied={fetchMessages} // Truyền hàm để làm mới danh sách
            />
        </>
    );
};

export default MessageManagementTab;