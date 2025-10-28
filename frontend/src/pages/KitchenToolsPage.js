// src/pages/KitchenToolsPage.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { Container, Spinner, Alert, Card, Button } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import ToolModal from '../components/ToolModal';
import { Link } from 'react-router-dom';
// Import CSS liên quan nếu chưa có (dù HomePage.css đã import trong App.js nhưng để rõ ràng hơn)
import './HomePage.css'; // Đảm bảo HomePage.css được import

const KitchenToolsPage = () => {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useContext(AuthContext);

    const [showModal, setShowModal] = useState(false);
    const [editingTool, setEditingTool] = useState(null);

    const fetchTools = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/tools');
            setTools(res.data);
        } catch (err) {
            setError('Không thể tải danh sách dụng cụ.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTools();
    }, [fetchTools]);

    const handleEdit = (tool) => {
        setEditingTool(tool);
        setShowModal(true);
    };

    const handleDelete = async (toolId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa dụng cụ này?')) {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`/api/tools/${toolId}`, config);
                fetchTools(); // Tải lại danh sách sau khi xóa
            } catch (err) {
                // Sử dụng alert hoặc toast để thông báo lỗi thân thiện hơn
                alert(err.response?.data?.msg || "Xóa thất bại.");
            }
        }
    };

    const handleAddNew = () => {
        setEditingTool(null); // Đặt editingTool thành null khi thêm mới
        setShowModal(true);
    };

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;

    return (
        <>
            <div className="section"> {/* Sử dụng class section từ HomePage.css */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    {/* Sử dụng class section-title */}
                    <h1 className="section-title mb-0">Dụng cụ nhà bếp</h1>
                    {user?.role === 'admin' && (
                        <Button variant="primary" onClick={handleAddNew}>+ Thêm Dụng cụ</Button>
                    )}
                </div>

                 {/* Sử dụng lại grid layout courses-grid */}
                <div className="courses-grid">
                    {tools.map(tool => (
                        /* Sử dụng lại class course-card cho card dụng cụ */
                        <Card key={tool.id} className="h-100 course-card">
                            <Link to={`/kitchen-tools/${tool.id}`} className="course-card-link">
                                {/* Sử dụng lại class course-card-image */}
                                <Card.Img variant="top" src={tool.image_url || 'https://via.placeholder.com/260x160'} alt={tool.name} className="course-card-image" />
                            </Link>
                            {/* Sử dụng lại class course-card-body */}
                            <Card.Body className="d-flex flex-column course-card-body">
                                <Card.Title as="h5">{tool.name}</Card.Title>
                                {/* Thêm class CSS tool-card-description */}
                                <Card.Text className="text-muted small flex-grow-1 tool-card-description">
                                    {tool.description}
                                </Card.Text>
                                {/* Thêm class course-price */}
                                <h4 className="text-danger mt-auto course-price">{new Intl.NumberFormat('vi-VN').format(tool.price)} VND</h4>
                                <div className="d-grid gap-2 mt-2">
                                    <Button
                                        variant="outline-primary"
                                        as={Link}
                                        to={`/kitchen-tools/${tool.id}`}
                                    >
                                        Xem thông tin
                                    </Button>

                                    {user?.role === 'admin' && (
                                        <div className="d-flex justify-content-end gap-2 mt-2">
                                            <Button variant="outline-primary" size="sm" onClick={() => handleEdit(tool)}>Sửa</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(tool.id)}>Xóa</Button>
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Modal thêm/sửa dụng cụ */}
            <ToolModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                tool={editingTool} // Truyền dụng cụ cần sửa (hoặc null nếu thêm mới)
                onSave={fetchTools} // Truyền hàm để tải lại danh sách sau khi lưu
            />
        </>
    );
};

export default KitchenToolsPage;