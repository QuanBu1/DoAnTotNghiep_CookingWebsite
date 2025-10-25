// src/components/Navbar.js
import React, { useContext, useState, useEffect } from 'react';
// *** THÊM useLocation vào đây ***
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Nav, NavDropdown, Button, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import AuthContext from '../context/AuthContext';
import './Navbar.css';
import NotificationBell from './NotificationBell';
import CartModal from './CartModal';

const calculateCartCount = () => {
    // ... (phần code này giữ nguyên)
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        return cart.reduce((total, item) => total + item.quantity, 0);
    } catch (e) {
        console.error("Lỗi khi tải giỏ hàng từ LocalStorage", e);
        return 0;
    }
};


const CustomNavbar = ({ toggleMobileSidebar, isFullLayout }) => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();
    // *** Lấy thông tin location ***
    const location = useLocation();

    const [showCartModal, setShowCartModal] = useState(false);
    const [cartCount, setCartCount] = useState(calculateCartCount());

    useEffect(() => {
        // ... (phần code này giữ nguyên)
        const handleCartUpdate = () => {
            setCartCount(calculateCartCount());
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        window.addEventListener('storage', handleCartUpdate);

        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
            window.removeEventListener('storage', handleCartUpdate);
        };
    }, []);

    // *** Xác định placeholder dựa trên location.pathname ***
    const getPlaceholderText = () => {
        if (location.pathname.startsWith('/kitchen-tools')) {
            return "Tìm kiếm dụng cụ nhà bếp...";
        }
        return "Tìm kiếm khóa học...";
    };

    const handleSearch = (e) => {
        // Lưu ý: Hiện tại chức năng tìm kiếm vẫn điều hướng đến trang tìm khóa học.
        // Nếu bạn muốn tìm kiếm dụng cụ riêng, cần cập nhật logic này.
        if (e.key === 'Enter' && searchTerm.trim() !== '') {
            // Tạm thời vẫn giữ điều hướng tìm kiếm khóa học
            navigate(`/courses/search?q=${searchTerm.trim()}`);
            // Nếu muốn tìm kiếm dụng cụ khi ở trang dụng cụ:
            // if (location.pathname.startsWith('/kitchen-tools')) {
            //     navigate(`/kitchen-tools/search?q=${searchTerm.trim()}`); // Cần tạo route và trang mới
            // } else {
            //     navigate(`/courses/search?q=${searchTerm.trim()}`);
            // }
        }
    };

    const handleCloseCart = () => {
        setShowCartModal(false);
    };

    return (
        <div className="custom-navbar">
            {isFullLayout ? (
                <>
                    <div className="navbar-left">
                        <Button variant="light" className="hamburger-btn" onClick={toggleMobileSidebar}>
                            <i className="bi bi-list"></i>
                        </Button>
                        <div className="navbar-search">
                            <i className="bi bi-search search-icon"></i>
                            <input
                                type="text"
                                // *** Sử dụng hàm getPlaceholderText ***
                                placeholder={getPlaceholderText()}
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={handleSearch}
                            />
                        </div>
                    </div>

                    {/* Phần navbar-right giữ nguyên */}
                    <Nav className="navbar-right align-items-center">
                        {/* ... (các icon giỏ hàng, liên hệ, thông báo, user dropdown) */}
                         <Nav.Link onClick={() => setShowCartModal(true)} className="position-relative me-3" title="Giỏ hàng">
                            <i className="bi bi-cart-fill fs-5"></i>
                            {cartCount > 0 &&
                                <Badge
                                    pill bg="danger"
                                    style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.6em' }}
                                >
                                    {cartCount > 9 ? '9+' : cartCount}
                                </Badge>
                            }
                        </Nav.Link>

                        <LinkContainer to="/contact">
                            <Nav.Link className="me-3" title="Liên hệ">
                                <i className="bi bi-headset fs-5"></i>
                            </Nav.Link>
                        </LinkContainer>

                        {isAuthenticated ? (
                            <>
                                <NotificationBell />
                                <NavDropdown title={user?.full_name || 'Tài khoản'} id="username-dropdown">
                                    <LinkContainer to="/profile"><NavDropdown.Item>Hồ sơ của tôi</NavDropdown.Item></LinkContainer>
                                    {user?.role === 'instructor' && (
                                        <LinkContainer to="/instructor-dashboard"><NavDropdown.Item>Trang quản lý Giảng viên</NavDropdown.Item></LinkContainer>
                                    )}
                                    {user?.role === 'admin' && <LinkContainer to="/admin"><NavDropdown.Item>Trang quản trị</NavDropdown.Item></LinkContainer>}
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item onClick={logout}>Đăng xuất</NavDropdown.Item>
                                </NavDropdown>
                            </>
                        ) : null}
                    </Nav>
                </>
            ) : (
                 // Giao diện tối giản cho trang Đăng nhập/Đăng ký (giữ nguyên)
                <div className="auth-navbar-container">
                    <Link to="/about">
                        <img src="/images/logo1.png" alt="Bếp của Quân Logo" className="auth-navbar-logo" />
                    </Link>
                </div>
            )}

            <CartModal
                show={showCartModal}
                handleClose={handleCloseCart}
            />
        </div>
    );
};

export default CustomNavbar;