// src/components/KitchenToolsManagementTab.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Alert, ButtonGroup, Form, InputGroup, Row, Col, Spinner } from 'react-bootstrap'; // Thêm imports
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import ToolModal from './ToolModal';
import AdminPagination from './AdminPagination'; // Import

const KitchenToolsManagementTab = () => {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    // State cho modal
    const [showModal, setShowModal] = useState(false);
    const [editingTool, setEditingTool] = useState(null);

    // State cho tìm kiếm, phân trang
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(10);

    const fetchTools = useCallback(async (page = 1, search = searchTerm) => {
        setLoading(true);
        try {
            setError('');
            const config = {
                // Không cần token cho GET all tools nếu API public, nhưng gửi cũng không sao
                // headers: { 'Authorization': `Bearer ${token}` },
                params: {
                    page,
                    limit,
                    search: search.trim()
                    // Không có filter cho tools
                }
            };
            const res = await axios.get('/api/admin/tools', config); // Gọi API admin đã cập nhật
            setTools(res.data.data);
            setTotalPages(res.data.pagination.totalPages);
            setCurrentPage(res.data.pagination.currentPage);
            setTotalItems(res.data.pagination.totalItems);
        } catch (err) {
            setError('Không thể tải danh sách dụng cụ.');
            setTools([]);
            setTotalPages(1);
            setCurrentPage(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [limit, searchTerm]); // Bỏ token nếu API GET là public

    useEffect(() => {
        fetchTools(currentPage, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]); // Chỉ fetch lại khi trang thay đổi

    // Handlers tương tự
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearch = () => {
        setCurrentPage(1);
        fetchTools(1, searchTerm);
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

     const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Handlers modal và delete giữ nguyên
    const handleEdit = (tool) => {
        setEditingTool(tool);
        setShowModal(true);
    };

    const handleDelete = async (toolId) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa dụng cụ ID: ${toolId}?`)) {
            try {
                // Cần token để xóa
                const config = { headers: { 'Authorization': `Bearer ${token}` } };
                await axios.delete(`/api/tools/${toolId}`, config); // API delete nằm ở /api/tools
                fetchTools(currentPage, searchTerm); // Tải lại
            } catch (err) {
                setError(err.response?.data?.msg || 'Xóa dụng cụ thất bại.');
            }
        }
    };

    const handleAddNew = () => {
        setEditingTool(null);
        setShowModal(true);
    };

    return (
        <>
            {/* Thanh công cụ */}
            <Row className="mb-3 g-2 align-items-center">
                <Col md="auto">
                    <Button variant="primary" onClick={handleAddNew}>+ Thêm Dụng cụ</Button>
                </Col>
                <Col>
                     <InputGroup>
                        <Form.Control
                            type="text"
                            placeholder="Tìm theo tên, mô tả, thông số..."
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            onKeyPress={handleSearchKeyPress}
                        />
                        <Button variant="outline-secondary" onClick={handleSearch}>
                             <i className="bi bi-search"></i> Tìm
                        </Button>
                    </InputGroup>
                </Col>
            </Row>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            {/* Thông tin tổng số và loading */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                 <small className="text-muted">Hiển thị {tools.length} trên tổng số {totalItems} dụng cụ</small>
                 {loading && <Spinner animation="border" size="sm" />}
            </div>

            {/* Bảng dữ liệu */}
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
                    {!loading && tools.map(tool => (
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
                                <ButtonGroup size="sm">
                                    <Button variant="outline-primary" onClick={() => handleEdit(tool)} title="Sửa"><i className="bi bi-pencil-fill"></i></Button>
                                    <Button variant="outline-danger" onClick={() => handleDelete(tool.id)} title="Xóa"><i className="bi bi-trash-fill"></i></Button>
                                </ButtonGroup>
                            </td>
                        </tr>
                    ))}
                     {loading && (
                        <tr>
                            <td colSpan="5" className="text-center">
                                <Spinner animation="border" size="sm" /> Đang tải...
                            </td>
                        </tr>
                     )}
                     {!loading && tools.length === 0 && (
                        <tr>
                            <td colSpan="5" className="text-center text-muted">Không tìm thấy dụng cụ nào.</td>
                        </tr>
                     )}
                </tbody>
            </Table>

            {/* Phân trang */}
            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            {/* Modal thêm/sửa */}
            <ToolModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                tool={editingTool}
                onSave={() => fetchTools(editingTool ? currentPage : 1)} // Tải lại trang 1 nếu thêm mới
            />
        </>
    );
};

export default KitchenToolsManagementTab;