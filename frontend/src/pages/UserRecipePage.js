// src/pages/UserRecipePage.js

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Form, Modal, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import './HomePage.css'; 

// --- Helper Functions for Data Serialization/Deserialization ---
// Chuyển JSON string từ DB sang mảng objects
const deserializeData = (data) => {
    if (!data) return [];
    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        // Fallback: Nếu không phải JSON, trả về mảng rỗng
        return [];
    }
};

// Component Modal cho thêm/sửa công thức
const RecipeFormModal = ({ show, handleClose, recipe, onSave, onDelete }) => { 
    const { token, user } = useContext(AuthContext);
    
    // Khối 1: State cho các trường đơn lẻ
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    
    // THÊM: State cho Khẩu phần và Thời gian nấu
    const [servingSize, setServingSize] = useState('2'); 
    const [cookingTime, setCookingTime] = useState('1 giờ 30 phút'); 

    // Khối 2: State cho các trường mảng
    const [ingredientsList, setIngredientsList] = useState([]);
    const [stepsList, setStepsList] = useState([]);
    
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            setError('');
            if (recipe) {
                setTitle(recipe.title || '');
                setDescription(recipe.description || '');
                setImageUrl(recipe.image_url || '');
                
                // CẬP NHẬT: Đọc dữ liệu từ 2 trường mới (nếu có)
                setServingSize(recipe.serving_size || '2'); 
                setCookingTime(recipe.cooking_time || '1 giờ 30 phút');

                // Deserialization cho Nguyên liệu và Hướng dẫn
                setIngredientsList(deserializeData(recipe.ingredients));
                setStepsList(deserializeData(recipe.instructions));
                
            } else {
                setTitle(''); setDescription(''); setImageUrl('');
                // Reset về mặc định khi tạo mới
                setServingSize('2'); 
                setCookingTime('1 giờ 30 phút');

                // Khởi tạo mảng với mục đầu tiên
                setIngredientsList([{ id: Date.now(), text: '' }]);
                setStepsList([{ id: Date.now() + 1, text: '', imageUrl: '' }]);
            }
        }
    }, [show, recipe]);


    // === LOGIC QUẢN LÝ DỮ LIỆU ĐỘNG (Giữ nguyên) ===
    
    // A. Quản lý Nguyên liệu
    const addIngredient = () => {
        setIngredientsList([...ingredientsList, { id: Date.now(), text: '' }]);
    };

    const removeIngredient = (id) => {
        setIngredientsList(ingredientsList.filter(item => item.id !== id));
    };

    const handleIngredientChange = (id, newText) => {
        setIngredientsList(ingredientsList.map(item => 
            item.id === id ? { ...item, text: newText } : item
        ));
    };

    // B. Quản lý Các bước
    const addStep = () => {
        setStepsList([...stepsList, { id: Date.now(), text: '', imageUrl: '' }]);
    };

    const removeStep = (id) => {
        setStepsList(stepsList.filter(item => item.id !== id));
    };

    const handleStepChange = (id, field, newValue) => {
        setStepsList(stepsList.map(item => 
            item.id === id ? { ...item, [field]: newValue } : item
        ));
    };
    
    // === LOGIC SUBMIT (SERIALIZATION) ===
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // 1. Serialization: chuyển state array thành JSON string để gửi lên backend
        const finalIngredients = ingredientsList.filter(i => i.text.trim() !== '');
        const finalInstructions = stepsList.filter(s => s.text.trim() !== '');
        
        const submissionData = {
            title,
            description,
            image_url: imageUrl,
            ingredients: JSON.stringify(finalIngredients), 
            instructions: JSON.stringify(finalInstructions),
            serving_size: servingSize, // THÊM vào submissionData
            cooking_time: cookingTime // THÊM vào submissionData
        };
        
        if (!title || finalIngredients.length === 0 || finalInstructions.length === 0) {
             setError('Vui lòng điền tiêu đề, ít nhất một nguyên liệu và một bước làm.');
             return;
        }
        
        try {
            const config = { headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
             } };
            
            if (recipe) {
                await axios.put(`/api/user-recipes/${recipe.id}`, submissionData, config);
                toast.success('Cập nhật công thức thành công!');
            } else {
                await axios.post('/api/user-recipes', submissionData, config);
                toast.success('Thêm công thức mới thành công!');
            }
            onSave();
            handleClose();
        } catch (err) {
            setError(err.response?.data?.msg || 'Thao tác thất bại. Vui lòng kiểm tra lại.');
        }
    };
    
    // Xử lý Xóa từ bên trong Modal
    const handleDeleteFromModal = () => {
        if (recipe && onDelete && window.confirm('Bạn có chắc chắn muốn xóa công thức này?')) {
            onDelete(recipe.id); 
            handleClose();
        }
    };
    
    // --- KHỐI RENDER MẢNG NGUYÊN LIỆU (Giữ nguyên) ---
    const renderIngredients = () => (
        <>
            <h4 className="fw-bold">Nguyên Liệu</h4>
            {ingredientsList.map((item, index) => (
                <div key={item.id} className="d-flex align-items-center mb-2">
                    <i className="bi bi-list me-2 text-muted"></i>
                    <Form.Control 
                        type="text"
                        value={item.text}
                        onChange={(e) => handleIngredientChange(item.id, e.target.value)}
                        placeholder="Ví dụ: 250g bột mì"
                    />
                    <Button variant="link" onClick={() => removeIngredient(item.id)} className="text-danger p-0 ms-2" disabled={ingredientsList.length === 1}>
                        <i className="bi bi-trash"></i>
                    </Button>
                </div>
            ))}
            <Button variant="link" size="sm" onClick={addIngredient} className="text-decoration-none p-0 d-flex align-items-center">
                <i className="bi bi-plus-lg me-1"></i> Thêm Nguyên liệu
            </Button>
        </>
    );
    
    // --- KHỐI RENDER MẢNG CÁC BƯỚC (Giữ nguyên) ---
   // === HÀM RENDER ĐÃ ĐƯỢC SỬA LỖI ===
    const renderSteps = () => (
        <>
            <h4 className="fw-bold">Các bước</h4>
            {stepsList.map((step, index) => (
                <Card key={step.id} className="mb-4 shadow-sm border-0">
                    <Card.Body>
                        <Row>
                            <Col xs={3} className="text-center">
                                <div style={{ border: '1px solid #eee', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', marginBottom: '10px' }}>
                                    {step.imageUrl ? (
                                        <img src={step.imageUrl} alt={`Bước ${index + 1}`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}/>
                                    ) : (
                                        <i className="bi bi-camera fs-3 text-muted"></i>
                                    )}
                                </div>
                                <Form.Control
                                    size="sm"
                                    type="text"
                                    placeholder="URL Ảnh"
                                    value={step.imageUrl || ''} // SỬA LỖI: Luôn đảm bảo giá trị là một chuỗi
                                    onChange={(e) => handleStepChange(step.id, 'imageUrl', e.target.value)}
                                />
                            </Col>
                            <Col xs={9}>
                                <div className="d-flex align-items-start">
                                    <span className="fw-bold fs-5 me-2 text-primary">{index + 1}</span>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        value={step.text || ''} // Sửa tương tự để đảm bảo an toàn
                                        onChange={(e) => handleStepChange(step.id, 'text', e.target.value)}
                                        placeholder={`Mô tả chi tiết bước làm này...`}
                                        required
                                    />
                                    <Button variant="link" onClick={() => removeStep(step.id)} className="text-danger p-0 ms-2" disabled={stepsList.length === 1}>
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            ))}
            <Button variant="link" size="sm" onClick={addStep} className="text-decoration-none p-0 d-flex align-items-center">
                <i className="bi bi-plus-lg me-1"></i> Thêm Bước làm
            </Button>
        </>
    );
    // === KẾT THÚC HÀM SỬA LỖI ===

    return (
        <Modal show={show} onHide={handleClose} centered size="xl" dialogClassName="recipe-modal-dialog">
            <Modal.Header closeButton className="p-2 border-0">
                <div className="d-flex w-100 justify-content-between align-items-center me-4">
                    <span className="text-muted small">Đã lưu</span>
                    <div>
                        {recipe && <Button variant="outline-danger" size="sm" className="me-2" onClick={handleDeleteFromModal}>Xóa</Button>}
                        <Button variant="outline-secondary" size="sm" className="me-2" onClick={handleClose}>Lưu và Đóng</Button>
                        <Button variant="warning" size="sm" onClick={handleSubmit}>Lên sóng</Button>
                    </div>
                </div>
            </Modal.Header>
            <Modal.Body className="bg-light p-5">
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    
                    {/* KHỐI TIÊU ĐỀ VÀ THÔNG TIN TÁC GIẢ */}
                    <div className="mb-4 p-4 bg-white shadow-sm rounded">
                        <Form.Group>
                            <Form.Control 
                                type="text" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                required 
                                placeholder="Tên món: Nhập tên món ăn của bạn"
                                className="h2 fw-bold border-0 p-0 mb-2"
                                style={{ fontSize: '1.8rem', backgroundColor: 'transparent' }}
                            />
                        </Form.Group>
                        <p className="text-muted mb-3">
                            <img 
                                src={user?.avatar_url || '/images/student-avatar.jpg'} 
                                alt="Avatar" 
                                style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
                            />
                            **{user?.full_name || 'Khách'}**
                        </p>
                        <Form.Group>
                            <Form.Control 
                                as="textarea" 
                                rows={2} 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                placeholder="Hãy chia sẻ với mọi người về món này nhé! Dùng ký tự @ để đề cập đến ai đó."
                            />
                        </Form.Group>
                    </div>

                    <Row>
                        {/* Cột Trái: Ảnh và Nguyên liệu */}
                        <Col lg={4}>
                            <Card className="shadow-sm mb-4">
                                <Card.Body className="text-center">
                                    {/* Giả lập khu vực tải ảnh */}
                                    <div style={{ border: '2px dashed #ccc', padding: '2rem', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' }}>
                                        {imageUrl ? (
                                            <img src={imageUrl} alt="Món nấu" className="img-fluid" style={{ maxHeight: '100%' }}/>
                                        ) : (
                                            <p className="text-muted">Bạn đã đăng hình món nấu ở đây chưa?</p>
                                        )}
                                    </div>
                                    <Form.Control type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Dán URL ảnh món ăn" className="mt-3" />
                                </Card.Body>
                            </Card>

                            {/* HIỂN THỊ DỮ LIỆU NGUYÊN LIỆU */}
                            {renderIngredients()}
                            
                            {/* KHỐI THỜI GIAN (ĐÃ SỬA LỖI) */}
                            <h4 className="fw-bold mt-4">Thông tin thêm</h4>
                            <Card className="shadow-sm p-3">
                                <Row className="mb-3">
                                    <Col xs={6}>
                                        <label className="text-muted small mb-1">Khẩu phần</label>
                                        <InputGroup size="sm">
                                            <Form.Control 
                                                value={servingSize} // Dùng state
                                                onChange={(e) => setServingSize(e.target.value)} // Cập nhật state
                                            /> 
                                            <InputGroup.Text>người</InputGroup.Text>
                                        </InputGroup>
                                    </Col>
                                    <Col xs={6}>
                                        <label className="text-muted small mb-1">Thời gian nấu</label>
                                        <InputGroup size="sm">
                                            <Form.Control 
                                                value={cookingTime} // Dùng state
                                                onChange={(e) => setCookingTime(e.target.value)} // Cập nhật state
                                            /> 
                                            <InputGroup.Text>giờ/phút</InputGroup.Text>
                                        </InputGroup>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        {/* Cột Phải: Hướng dẫn chi tiết */}
                        <Col lg={8}>
                            {renderSteps()}
                        </Col>
                    </Row>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

// Component chính (Giữ nguyên)
const UserRecipePage = () => {
    const { token, user } = useContext(AuthContext);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [showModal, setShowModal] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState(null);

    const fetchRecipes = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get('/api/user-recipes', config);
            setRecipes(res.data);
        } catch (err) {
            setError('Không thể tải danh sách công thức của bạn.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    const handleAddNew = () => {
        setEditingRecipe(null);
        setShowModal(true);
    };

    const handleEdit = (recipe) => {
        setEditingRecipe(recipe);
        setShowModal(true);
    };

    // HÀM handleDelete đã được sửa để sử dụng useCallback
    const handleDelete = useCallback(async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`/api/user-recipes/${id}`, config);
            toast.success('Đã xóa công thức thành công!');
            fetchRecipes();
        } catch (err) {
            toast.error('Xóa công thức thất bại.');
        }
    }, [token, fetchRecipes]);
    
    // Tạm thời tạo một trang chi tiết giả lập để xem
    const RecipeCard = ({ recipe }) => (
        <Card className="h-100 course-card" style={{ cursor: 'pointer' }} onClick={() => handleEdit(recipe)}>
             <Card.Img variant="top" src={recipe.image_url || '/images/banner4.jpg'} alt={recipe.title} className="course-card-image" />
            <Card.Body className="d-flex flex-column">
                <Card.Title as="h5">{recipe.title}</Card.Title>
                <Card.Text className="text-muted small flex-grow-1">{recipe.description || 'Chưa có mô tả ngắn.'}</Card.Text>
                
                <div className="d-flex justify-content-between gap-2 mt-auto pt-3 border-top">
                    <Button variant="outline-primary" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(recipe); }}>Sửa</Button>
                    <Button variant="outline-danger" size="sm" onClick={(e) => { e.stopPropagation(); if(window.confirm('Bạn có chắc chắn muốn xóa?')) handleDelete(recipe.id); }}>Xóa</Button>
                </div>
            </Card.Body>
        </Card>
    );

    if (!user) return <Container className="my-5"><Alert variant="danger">Vui lòng đăng nhập để xem công thức của bạn.</Alert></Container>
    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /></Container>;
    if (error) return <Container><Alert variant="danger">{error}</Alert></Container>;

    return (
        <div className="section">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="section-title mb-0">Công thức Cá nhân của {user?.full_name}</h1>
                <Button variant="success" onClick={handleAddNew}>+ Tải công thức của bạn</Button>
            </div>

            {recipes.length > 0 ? (
                <div className="courses-grid">
                    {recipes.map(recipe => (
                         <div key={recipe.id}>
                            <RecipeCard recipe={recipe} />
                        </div>
                    ))}
                </div>
            ) : (
                <Alert variant="info" className="text-center">
                    Bạn chưa lưu công thức nào. Hãy bắt đầu tải công thức đầu tiên!
                </Alert>
            )}
            
            <RecipeFormModal 
                show={showModal}
                handleClose={() => setShowModal(false)}
                recipe={editingRecipe}
                onSave={fetchRecipes}
                onDelete={handleDelete} // TRUYỀN HÀM handleDelete XUỐNG
            />
        </div>
    );
};

export default UserRecipePage;