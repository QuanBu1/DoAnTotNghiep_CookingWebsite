// src/components/ToolRevenueTab.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Alert, Spinner, Card } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const ToolRevenueTab = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    const fetchToolRevenue = useCallback(async () => {
        try {
            setError('');
            setLoading(true);
            const config = { headers: { 'Authorization': `Bearer ${token}` } };
            const res = await axios.get('/api/admin/tool-revenue', config);
            setStats(res.data);
        } catch (err) {
            setError('Không thể tải dữ liệu doanh thu.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchToolRevenue();
        }
    }, [token, fetchToolRevenue]);
    
    // Tính tổng doanh thu từ tất cả các sản phẩm
    const totalRevenue = stats.reduce((acc, item) => acc + item.total_revenue, 0);

    if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Card className="text-center shadow-sm mb-4" style={{ maxWidth: '300px' }}>
                <Card.Body>
                    <Card.Title as="h5">Tổng Doanh Thu Dụng Cụ</Card.Title>
                    <Card.Text as="h2" className="text-success fw-bold">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}
                    </Card.Text>
                </Card.Body>
            </Card>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Tên Sản phẩm</th>
                        <th>Số lượng đã bán</th>
                        <th>Tổng Doanh thu</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.map((item, index) => (
                        <tr key={item.id}>
                            <td>{index + 1}</td>
                            <td>{item.name}</td>
                            <td>{item.quantity_sold}</td>
                            <td className="fw-bold">{new Intl.NumberFormat('vi-VN').format(item.total_revenue)} VND</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
};

export default ToolRevenueTab;