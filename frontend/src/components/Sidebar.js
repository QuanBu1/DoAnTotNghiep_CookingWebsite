// src/components/Sidebar.js
import React, { useContext } from 'react'; 
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import AuthContext from '../context/AuthContext'; 
import './Sidebar.css';

const Sidebar = ({ isExpanded, setExpanded, isMobileOpen, setMobileOpen }) => {
    // 3. Lấy thông tin user và trạng thái đăng nhập
    const { isAuthenticated, user, logout } = useContext(AuthContext);

    return (
        <>
            <div 
                className={`sidebar-overlay ${isMobileOpen ? 'show' : ''}`}
                onClick={() => setMobileOpen(false)}
            ></div>
            <div 
                className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'} ${isMobileOpen ? 'mobile-open' : ''}`}
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
            >
                <div className="sidebar-logo">
                    <NavLink to="/">
                        <img src="/images/logo1.png" alt="Bếp của Quân Logo" className="logo-img" />
                    </NavLink>
                </div>
                <Nav className="flex-column sidebar-nav">
                    {/* THÊM LINK GIỚI THIỆU */}
                    <NavLink to="/about" className="nav-link">
                        <i className="bi bi-info-circle-fill nav-icon"></i>
                        <span className="nav-text">Giới thiệu</span>
                    </NavLink>
                    {/* Các mục menu chính */}
                    <NavLink to="/" className="nav-link" end>
                        <i className="bi bi-house-door-fill nav-icon"></i>
                        <span className="nav-text">Trang chủ</span>
                    </NavLink>
                    <NavLink to="/courses" className="nav-link">
                        <i className="bi bi-cup-hot-fill nav-icon"></i>
                        <span className="nav-text">Khóa học</span>
                    </NavLink>
                    
                    <NavLink to="/community-recipes" className="nav-link">
                        <i className="bi bi-share-fill nav-icon"></i>
                        <span className="nav-text">Cộng đồng</span>
                    </NavLink>
                    <NavLink to="/kitchen-tools" className="nav-link">
                        <i className="bi bi-shop nav-icon"></i>
                        <span className="nav-text">Dụng cụ nhà bếp</span>
                    </NavLink>
                </Nav>

                {/* === PHẦN THÊM MỚI CHO USER === */}
                <Nav className="flex-column sidebar-nav sidebar-footer">
                    {isAuthenticated ? (
                        <>
                            <NavLink to="/profile" className="nav-link">
                                <i className="bi bi-person-circle nav-icon"></i>
                                <span className="nav-text">{user?.full_name}</span>
                            </NavLink>
                            {/* THÊM LINK CÔNG THỨC CÁ NHÂN */}
                            <NavLink to="/my-recipes" className="nav-link">
                                <i className="bi bi-journal-album nav-icon"></i>
                                <span className="nav-text">Công thức cá nhân</span>
                            </NavLink>
                            {/* Hiển thị link trang quản lý tương ứng với vai trò */}
                            {user?.role === 'admin' && (
                                <NavLink to="/admin" className="nav-link">
                                    <i className="bi bi-shield-lock-fill nav-icon"></i>
                                    <span className="nav-text">Trang Admin</span>
                                </NavLink>
                            )}
                             {user?.role === 'instructor' && (
                                <NavLink to="/instructor-dashboard" className="nav-link">
                                    <i className="bi bi-easel-fill nav-icon"></i>
                                    <span className="nav-text">Trang Giảng viên</span>
                                </NavLink>
                            )}
                            <a href="#!" className="nav-link" onClick={logout}>
                                <i className="bi bi-box-arrow-right nav-icon"></i>
                                <span className="nav-text">Đăng xuất</span>
                            </a>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className="nav-link">
                                <i className="bi bi-box-arrow-in-right nav-icon"></i>
                                <span className="nav-text">Đăng nhập</span>
                            </NavLink>
                            <NavLink to="/register" className="nav-link">
                                <i className="bi bi-person-plus-fill nav-icon"></i>
                                <span className="nav-text">Đăng ký</span>
                            </NavLink>
                        </>
                    )}
                </Nav>
            </div>
        </>
    );
};

export default Sidebar;