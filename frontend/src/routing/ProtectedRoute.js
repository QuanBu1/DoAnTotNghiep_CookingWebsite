// src/routing/ProtectedRoute.js

import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

const ProtectedRoute = ({ children, roles }) => { // Đổi 'role' thành 'roles'
    const { isAuthenticated, user, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return (
            <Container className="text-center my-5">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Nếu route này yêu cầu vai trò và vai trò của người dùng không nằm trong danh sách được phép,
    // thì chuyển hướng về trang chủ.
    // Logic mới này chấp nhận một mảng các vai trò.
    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;