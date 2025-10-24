// src/components/KitchenToolsManagementTab.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, ButtonGroup, Spinner } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import ToolModal from './ToolModal';

const KitchenToolsManagementTab = () => {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    const [showModal, setShowModal] = useState(false);
    const [editingTool, setEditingTool] = useState(null);

    const fetchTools = useCallback(async () => {
        try {
            setError('');
            setLoading(true);
            // API công khai để lấy tất cả dụng cụ
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
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                // API DELETE đã được bảo vệ bởi adminMiddleware ở backend
                await axios.delete(`/api/tools/${toolId}`, config); 
                fetchTools();
            } catch (err) {
                setError(err.response?.data?.msg || 'Xóa dụng cụ thất bại.');
            }
        }
    };

    const handleAddNew = () => {
        setEditingTool(null);
        setShowModal(true);
    };

    if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;

    return (
        <>
            <div className="d-flex justify-content-end mb-3">
                <Button variant="primary" onClick={handleAddNew}>+ Thêm Dụng cụ mới</Button>
            </div>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            <Table striped bordered hover responsive>
                 <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên Dụng cụ</th>
                        <th>Giá (VND)</th>
                        <th>Link mua</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {tools.map(tool => (
                        <tr key={tool.id}>
                            <td>{tool.id}</td>
                            <td>
                                <img 
                                    src={tool.image_url || 'https://via.placeholder.com/50x50'} 
                                    alt={tool.name} 
                                    style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                                />
                                {tool.name}
                            </td>
                            <td>{new Intl.NumberFormat('vi-VN').format(tool.price)}</td>
                            <td>{tool.purchase_link ? <a href={tool.purchase_link} target="_blank" rel="noopener noreferrer">Link</a> : 'N/A'}</td>
                            <td>
                                <ButtonGroup>
                                    <Button variant="outline-primary" size="sm" onClick={() => handleEdit(tool)}>Sửa</Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(tool.id)}>Xóa</Button>
                                </ButtonGroup>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <ToolModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                tool={editingTool}
                onSave={fetchTools}
            />
        </>
    );
};

export default KitchenToolsManagementTab;