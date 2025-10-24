// src/components/RevenueManagementTab.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Card, Col, Row, Spinner, Table, Alert } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const RevenueManagementTab = () => {
    const [stats, setStats] = useState({ totalRevenue: 0, recentTransactions: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    const fetchStats = useCallback(async () => {
        try {
            setError('');
            setLoading(true);
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const res = await axios.get('http://localhost:5000/api/admin/revenue-stats', config);
            setStats(res.data);
        } catch (err) {
            setError('Không thể tải dữ liệu thống kê.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchStats();
        }
    }, [token, fetchStats]);

    if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Row>
                <Col md={4}>
                    <Card className="text-center shadow-sm">
                        <Card.Body>
                            <Card.Title as="h5">Tổng Doanh Thu</Card.Title>
                            <Card.Text as="h2" className="text-success fw-bold">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue)}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                {/* Bạn có thể thêm các Card thống kê khác ở đây sau, ví dụ: Số học viên mới */}
            </Row>

            <h4 className="mt-5">Giao dịch gần đây</h4>
            <Table striped bordered hover responsive className="mt-3">
                <thead>
                    <tr>
                        <th>ID Giao dịch</th>
                        <th>Học viên</th>
                        <th>Khóa học</th>
                        <th>Số tiền</th>
                        <th>Ngày thanh toán</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.recentTransactions.map(tx => (
                        <tr key={tx.id}>
                            <td>{tx.id}</td>
                            <td>{tx.user_name}</td>
                            <td>{tx.course_title}</td>
                            <td>{new Intl.NumberFormat('vi-VN').format(tx.amount)} VND</td>
                            <td>{new Date(tx.payment_date).toLocaleString('vi-VN')}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
};

export default RevenueManagementTab;