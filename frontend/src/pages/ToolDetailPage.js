// src/pages/ToolDetailPage.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import { Container, Row, Col, Card, Button, ListGroup, Badge, Alert, Spinner } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import './ToolDetailPage.css'; 
import { toast } from 'react-toastify';
import QuantityModal from '../components/QuantityModal';

const initialToolState = {
    id: null, name: "Đang tải...", price: 0, original_price: 0, discount_percent: 0,
    image_url: "", gallery: [], description: "", features: "Đang tải thông số...",
    long_description: "Đang tải thông tin chi tiết...", promo_banner_img: "/images/banner8.png", related_tools: []
};

const ToolDetailPage = () => {
    const { id: toolId } = useParams(); 
    const { user, token } = useContext(AuthContext); 
    const navigate = useNavigate(); 
    
    const [toolData, setToolData] = useState(initialToolState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const timer = { hours: '01', minutes: '44', seconds: '40' };

    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [modalAction, setModalAction] = useState(null);

    // SỬA ĐỔI: Cập nhật logic lấy dữ liệu
    const fetchToolDetails = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Gọi cả hai API cùng lúc: một để lấy chi tiết, một để lấy tất cả
            const [toolRes, allToolsRes] = await Promise.all([
                axios.get(`/api/tools/${toolId}`),
                axios.get('/api/tools')
            ]);
            
            const currentTool = toolRes.data;
            const allTools = allToolsRes.data;

            // Lọc ra các sản phẩm liên quan: là các sản phẩm khác sản phẩm hiện tại
            const related = allTools
                .filter(tool => tool.id !== currentTool.id) // Loại bỏ sản phẩm đang xem
                .sort(() => 0.5 - Math.random()) // Xáo trộn ngẫu nhiên
                .slice(0, 2); // Lấy 2 sản phẩm đầu tiên

            const calculatedData = {
                ...currentTool,
                original_price: currentTool.price ? currentTool.price * 1.5 : 0, 
                discount_percent: currentTool.price ? Math.round((1.5 * currentTool.price - currentTool.price) / (1.5 * currentTool.price) * 100) : 0,
                gallery: [currentTool.image_url, '/images/noicomdien2.jpg', '/images/noicomdien3.jpg', '/images/noicomdien4.jpg'],
                description_short: currentTool.description,
                promo_banner_img: "/images/banner8.png",
                related_tools: related // Gán danh sách sản phẩm liên quan thật
            };
            
            setToolData(calculatedData);
        } catch (err) {
            setError(err.response?.data?.msg || 'Không thể tải thông tin sản phẩm.');
        } finally {
            setLoading(false);
        }
    }, [toolId]);

    useEffect(() => {
        // Cuộn lên đầu trang mỗi khi toolId thay đổi
        window.scrollTo(0, 0);
        fetchToolDetails();
    }, [toolId, fetchToolDetails]);

    const handleQuantitySubmit = (quantity) => {
        if (modalAction === 'buyNow') {
            executeBuyNow(quantity);
        } else if (modalAction === 'addToCart') {
            executeAddToCart(quantity);
        }
    };

    const executeBuyNow = async (quantity) => {
        if (!user) {
            navigate('/login');
            return;
        }
        const tempAddress = user?.address || 'Chưa cập nhật địa chỉ.'; 
        if (tempAddress.includes('Chưa cập nhật')) {
             toast.error('Vui lòng cập nhật địa chỉ giao hàng trong trang Hồ sơ trước khi đặt hàng.');
             navigate('/profile');
             return;
        }
        
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const body = {
                items: [{
                    id: toolData.id, 
                    quantity: quantity,
                    name: toolData.name,
                    price: toolData.price
                }],
                shipping_address: tempAddress 
            };
            const res = await axios.post('/api/orders/tools', body, config);
            navigate(`/tool-checkout/${res.data.orderId}`);
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Tạo đơn hàng thất bại.');
        }
    };
    
    const executeAddToCart = (quantity) => {
        const newItem = {
            id: toolData.id, name: toolData.name, price: toolData.price,
            image_url: toolData.image_url, quantity: quantity,
        };
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItemIndex = cart.findIndex(item => item.id === toolData.id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push(newItem);
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        toast.success(`${quantity} x ${toolData.name} đã được thêm vào giỏ hàng!`);
        window.dispatchEvent(new Event('cartUpdated')); 
    };

    if (loading) return <Container className="text-center my-5"><Spinner animation="border" /> <p>Đang tải...</p></Container>;
    if (error) return <Container className="my-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!toolData.id) return <Container className="my-5"><Alert variant="warning">Không tìm thấy sản phẩm.</Alert></Container>;

    const featureList = toolData.features ? toolData.features.split('\n').filter(f => f.trim() !== '') : [];
    const { name, price, original_price, discount_percent, gallery, description_short, long_description, promo_banner_img, related_tools } = toolData;

    return (
        <>
            <Container className="tool-detail-page my-5">
                <Row>
                    <Col lg={8}>
                        <h1>{name}</h1>
                        <p className="lead text-muted">{description_short}</p>
                        <hr />
                        <Row className="tool-purchase-section">
                            <Col md={12} className="tool-gallery">
                                <img src={gallery[0]} alt={name} className="img-fluid main-image mb-3 shadow-sm rounded" />
                            </Col>
                        </Row>
                        <Card className="shadow-sm mt-4">
                            <Card.Body>
                                <Card.Title as="h5" className="tool-feature-title mb-3">Thông số kỹ thuật</Card.Title>
                                <ListGroup variant="flush">
                                    {featureList.length > 0 ? (
                                        featureList.map((feature, index) => <ListGroup.Item key={index} className="small">{feature}</ListGroup.Item>)
                                    ) : ( <ListGroup.Item className="text-muted">Chưa có thông số.</ListGroup.Item> )}
                                </ListGroup>
                                <Card.Title as="h5" className="tool-feature-title mt-4 mb-3">Thông tin chi tiết</Card.Title>
                                <div className="tool-long-description" dangerouslySetInnerHTML={{ __html: long_description }} />
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        <Card className="shadow-sm mb-4 p-0">
                            <Card.Img variant="top" src={promo_banner_img || '/images/default-banner.jpg'} alt="Banner"/>
                        </Card>
                        <Card className="shadow-sm tool-info-card my-4">
                            <Card.Body>
                                <Card.Title as="h5" className="tool-feature-title mb-3">Điểm nổi bật & Cam kết</Card.Title>
                                <ListGroup variant="flush">
                                    <ListGroup.Item><i className="bi bi-check-circle-fill text-primary me-2"></i>**ĐI KÈM XỬNG HẤP** tiện lợi</ListGroup.Item>
                                    <ListGroup.Item><i className="bi bi-truck text-primary me-2"></i>Giao hàng tận nhà nhanh chóng</ListGroup.Item>
                                    <ListGroup.Item><i className="bi bi-shield-check text-primary me-2"></i>Hư gì đổi nấy trong 12 tháng</ListGroup.Item>
                                </ListGroup>
                            </Card.Body>
                        </Card>

                        <Card className="shadow-sm border-0 price-card sticky-top-custom">
                            <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                    <h2 className="tool-price me-3">{new Intl.NumberFormat('vi-VN').format(price)}₫</h2>
                                    <span className="tool-original-price me-2">{new Intl.NumberFormat('vi-VN').format(original_price)}₫</span>
                                    <Badge bg="danger" className="p-2">-{discount_percent}%</Badge>
                                </div>
                                <Alert variant="danger" className="text-center timer-box mb-3">
                                    <p className="mb-1 fw-bold">Kết thúc sau</p>
                                    <div className="d-flex justify-content-center h4 fw-bolder mb-0">
                                        <span>{timer.hours}</span>:<span>{timer.minutes}</span>:<span>{timer.seconds}</span>
                                    </div>
                                </Alert>
                                <div className="d-grid gap-2 mb-3">
                                    <Button variant="danger" size="lg" onClick={() => { setModalAction('buyNow'); setShowQuantityModal(true); }}>
                                        MUA NGAY
                                    </Button>
                                    <Button variant="outline-primary" size="lg" onClick={() => { setModalAction('addToCart'); setShowQuantityModal(true); }}>
                                        <i className="bi bi-cart-plus me-2"></i> Thêm vào giỏ hàng
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                
                {/* SỬA ĐỔI: Cập nhật lại phần render sản phẩm liên quan */}
                <section className="mt-5">
                    <h2 className="section-title">Sản phẩm liên quan</h2>
                    <Row className="g-4">
                        {related_tools.map(tool => (
                            <Col md={3} sm={6} xs={12} key={tool.id}>
                                <Card className="related-tool-card h-100 shadow-sm">
                                    <Card.Img variant="top" src={tool.image_url} alt={tool.name} className="related-tool-image" />
                                    <Card.Body className='d-flex flex-column'>
                                        <Card.Title as="h6" className='flex-grow-1'>{tool.name}</Card.Title>
                                        <Card.Text className="text-danger fw-bold mb-1">
                                            {new Intl.NumberFormat('vi-VN').format(tool.price)}₫
                                        </Card.Text>
                                        {/* Giả lập giá cũ cho đẹp */}
                                        <Card.Text className="text-muted small text-decoration-line-through">
                                            {new Intl.NumberFormat('vi-VN').format(tool.price * 1.5)}₫
                                        </Card.Text>
                                        <Button variant="outline-primary" size="sm" onClick={() => navigate(`/kitchen-tools/${tool.id}`)}>Xem chi tiết</Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </section>

            </Container>

            <QuantityModal
                show={showQuantityModal}
                handleClose={() => setShowQuantityModal(false)}
                product={toolData}
                onSubmit={handleQuantitySubmit}
            />
        </>
    );
};

export default ToolDetailPage;