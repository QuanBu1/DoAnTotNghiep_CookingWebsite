// src/components/NotificationBell.js

import React, { useState, useEffect, useContext } from 'react';
import { Dropdown, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import io from 'socket.io-client';
import './NotificationBell.css';

const socket = io.connect("http://localhost:5000");

const NotificationBell = () => {
    const { user, token } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]); 
    const [loading, setLoading] = useState(true);

    const unreadCount = (notifications || []).filter(n => !n.is_read).length;

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!token) { setLoading(false); return; }
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get('/api/notifications', config);
                setNotifications(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Lỗi khi tải thông báo:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, [token]);

    useEffect(() => {
        if (user) {
            socket.emit('register_user', user.id);

            if ("Notification" in window && Notification.permission !== "granted") {
                Notification.requestPermission();
            }

            const handleNewNotification = (data) => {
                setNotifications(prev => [{ ...data, id: Date.now(), is_read: false, created_at: new Date().toISOString() }, ...prev]);
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification(data.title || 'Thông báo mới', { body: data.message });
                }
            };

            socket.on('new_notification', handleNewNotification);
            
            return () => {
                socket.off('new_notification', handleNewNotification);
            };
        }
    }, [user]); 

    const markAsRead = async (id) => {
        if (!token) return;
        setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, is_read: true } : notif));
    };
    
    const handleToggle = (isOpen) => {
        if (!isOpen && unreadCount > 0) {
            setTimeout(async () => {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                try {
                    await axios.put('/api/notifications/read-all', {}, config);
                    setNotifications(prev => prev.map(n => ({...n, is_read: true})));
                } catch (err) {
                    console.error("Failed to mark notifications as read", err);
                }
            }, 2000);
        }
    };

    const formatTime = (time) => {
        const date = new Date(time);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString('vi-VN');
    }

    const NotificationItem = ({ notif }) => {
        let linkPath = notif.link || '#';
        let icon = 'bi-bell-fill';
        let variant = 'light';
        
        if (notif.type === 'livestream_scheduled') {
            icon = 'bi-broadcast-pin';
            variant = 'danger';
        } else if (notif.type === 'new_enrollment') {
            icon = 'bi-person-plus-fill';
            variant = 'success';
        } else if (notif.type === 'new_qanda') {
            icon = 'bi-patch-question-fill';
            variant = 'info';
        } else if (notif.type === 'tool_order_status') {
             icon = 'bi-box-seam';
             variant = 'warning';
        } 
        else if (notif.type === 'submission_graded') {
             icon = 'bi-patch-check-fill';
             variant = 'primary';
        }

        return (
            <Dropdown.Item 
                as={Link} 
                to={linkPath} 
                className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
            >
                <div className="d-flex align-items-center">
                    <Badge bg={variant} className="me-3 p-2">
                        <i className={`bi ${icon}`} style={{fontSize: '1.2rem'}}></i>
                    </Badge>
                    <div>
                        <strong>{notif.title || 'Thông báo'}</strong>
                        <p className="mb-0">{notif.message}</p>
                        <small className="text-muted">{formatTime(notif.created_at)}</small>
                    </div>
                </div>
            </Dropdown.Item>
        );
    }

    if (!user) return null;
    
    return (
        <Dropdown onToggle={handleToggle} drop="start" className="notification-dropdown">
            <Dropdown.Toggle 
                variant="link" 
                id="notification-dropdown-toggle" 
                // THÊM CLASS MỚI VÀO ĐÂY
                className="position-relative p-0 text-decoration-none no-arrow"
            >
                <i className="bi bi-bell-fill" style={{fontSize: '1.4rem', color: '#333'}}></i>
                {unreadCount > 0 && (
                    <Badge pill bg="danger" className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="notification-menu">
                <Dropdown.Header><h4>Thông báo ({unreadCount} mới)</h4></Dropdown.Header>
                <div className="notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {loading ? (
                        <div className="text-center p-3"><Spinner animation="border" size="sm" /> Đang tải...</div>
                    ) : notifications.length > 0 ? (
                        notifications.map((notif) => ( <NotificationItem key={notif.id} notif={notif} /> ))
                    ) : (
                        <div className="text-center p-3 text-muted">Không có thông báo mới.</div>
                    )}
                </div>
                <Dropdown.Divider />
                <Dropdown.Item as={Link} to="/profile?tab=notifications" className="text-center text-primary">
                    Xem tất cả
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default NotificationBell;