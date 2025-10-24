// src/components/CartModal.js

import React, { useState, useEffect, useCallback, useContext } from 'react'; // THÊM useContext
import { Modal, Button, Table, Image, Form, Row, Col, Alert, Card } from 'react-bootstrap'; 
import { toast } from 'react-toastify';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // THÊM useNavigate
import AuthContext from '../context/AuthContext'; // THÊM AuthContext

const CartModal = ({ show, handleClose }) => {
    // THÊM: Sử dụng AuthContext và useNavigate
    const { token, user } = useContext(AuthContext);
    const navigate = useNavigate(); 
    
    const [cartItems, setCartItems] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false); // THÊM state xử lý
    
    // Hàm lấy dữ liệu từ Local Storage
    const fetchCart = useCallback(() => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        setCartItems(cart);
    }, []);

    useEffect(() => {
        if (show) {
            fetchCart();
        }
    }, [show, fetchCart]);

    // Hàm lưu dữ liệu vào Local Storage và cập nhật State
    const updateCartInStorage = (newCart) => {
        localStorage.setItem('cart', JSON.stringify(newCart));
        setCartItems(newCart);
        // Gửi sự kiện cập nhật để Navbar hiển thị số lượng mới (quan trọng!)
        window.dispatchEvent(new Event('cartUpdated')); 
    };
    
    // Xử lý thay đổi số lượng
    const handleQuantityChange = (id, newQuantity) => {
        if (newQuantity <= 0 || isNaN(newQuantity)) {
            handleRemoveItem(id);
            return;
        }

        const newCart = cartItems.map(item => 
            item.id === id ? { ...item, quantity: newQuantity } : item
        );
        updateCartInStorage(newCart);
    };

    // Xử lý xóa sản phẩm
    const handleRemoveItem = (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
            return;
        }
        const newCart = cartItems.filter(item => item.id !== id);
        updateCartInStorage(newCart);
        toast.info("Đã xóa sản phẩm khỏi giỏ hàng.");
    };

    // HÀM MỚI: Xử lý Thanh toán
  const handleCheckout = async () => {
        if (!token) {
            handleClose();
            navigate('/login');
            return;
        }
        
        if (cartItems.length === 0) return;
        
        const shippingAddress = user?.address;
        if (!shippingAddress || shippingAddress.includes('Chưa cập nhật')) {
             toast.error('Vui lòng cập nhật địa chỉ giao hàng trong trang Hồ sơ trước khi đặt hàng.');
             handleClose();
             navigate('/profile');
             return;
        }

        setIsProcessing(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            // KHÔNG CÒN VÒNG LẶP NỮA. GỬI TẤT CẢ ITEM TRONG MỘT LẦN GỌI.
            const body = {
                items: cartItems.map(item => ({
                    id: item.id,
                    name: item.name, // Thêm tên để Backend có thể lưu vào JSON
                    price: item.price,
                    quantity: item.quantity
                })),
                shipping_address: shippingAddress 
            };
            
            // Gọi API tạo đơn hàng MASTER duy nhất
            const res = await axios.post('/api/orders/tools', body, config);
            
            const { orderId } = res.data;

            // Xóa giỏ hàng sau khi tạo đơn hàng thành công
            updateCartInStorage([]); 
            toast.success(`Đã tạo đơn hàng dụng cụ #${orderId}. Vui lòng kiểm tra và hoàn tất thanh toán.`);
            
            // Chuyển hướng tới trang thanh toán chi tiết của đơn hàng MASTER
            handleClose();
            navigate(`/tool-checkout/${orderId}`); 

        } catch (err) {
            toast.error(err.response?.data?.msg || 'Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    };
    
    
    // Tính tổng số tiền và tổng số lượng
    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title><i className="bi bi-cart-fill me-2"></i> Giỏ hàng của tôi ({totalItems})</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {cartItems.length === 0 ? (
                    <Alert variant="info" className="text-center">
                        Giỏ hàng của bạn đang trống!
                    </Alert>
                ) : (
                    <>
                        <Table striped hover responsive className="cart-table">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Giá</th>
                                    <th>Số lượng</th>
                                    <th>Tổng cộng</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartItems.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <Image 
                                                    src={item.image_url || 'https://via.placeholder.com/50'} 
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                                                    className="me-3 rounded"
                                                />
                                                {item.name}
                                            </div>
                                        </td>
                                        <td>{new Intl.NumberFormat('vi-VN').format(item.price)} VND</td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                                                style={{ width: '80px' }}
                                            />
                                        </td>
                                        <td>
                                            <strong>{new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)} VND</strong>
                                        </td>
                                        <td>
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm" 
                                                onClick={() => handleRemoveItem(item.id)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        
                        <Row className="justify-content-end mt-4">
                            <Col md={5}>
                                <Card className='bg-light'>
                                    <Card.Body>
                                        <h5>Tổng tiền hàng</h5>
                                        <h4 className="text-danger fw-bold">
                                            {new Intl.NumberFormat('vi-VN').format(subtotal)} VND
                                        </h4>
                                        <Button 
                                            variant="success" 
                                            size="lg" 
                                            className="w-100 mt-3" 
                                            // GỠ KHÓA: Đã thêm onClick và loại bỏ disabled
                                            onClick={handleCheckout}
                                            disabled={isProcessing || cartItems.length === 0}
                                        >
                                            {isProcessing ? 'Đang tạo đơn hàng...' : 'Thanh toán'}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Tiếp tục mua hàng
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CartModal;