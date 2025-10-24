// src/context/AuthContext.js

import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Helper function to set the authorization header
const setAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        token: localStorage.getItem('token'),
        isAuthenticated: null,
        loading: true,
        user: null,
    });

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (token) {
            setAuthToken(token);
            try {
                const res = await axios.get('/api/user/me'); // URL tương đối
                setAuth({
                    token,
                    isAuthenticated: true,
                    loading: false,
                    user: res.data.user,
                });
            } catch (err) {
                localStorage.removeItem('token');
                setAuth({ token: null, isAuthenticated: false, loading: false, user: null });
            }
        } else {
            setAuth({ token: null, isAuthenticated: false, loading: false, user: null });
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (email, password) => {
        const config = { headers: { 'Content-Type': 'application/json' } };
        const body = JSON.stringify({ email, password });
        try {
            const res = await axios.post('/api/auth/login', body, config); // URL tương đối
            localStorage.setItem('token', res.data.token);
            await loadUser(); // Tải lại thông tin người dùng ngay sau khi đăng nhập
            return { success: true };
        } catch (err) {
            // Xử lý lỗi an toàn hơn
            if (err.response && err.response.data) {
                return { success: false, message: err.response.data.msg || 'Đã xảy ra lỗi' };
            } else {
                return { success: false, message: 'Không thể kết nối đến server. Vui lòng thử lại.' };
            }
        }
    };

    const register = async (fullName, email, password) => {
        const config = { headers: { 'Content-Type': 'application/json' } };
        const body = JSON.stringify({ fullName, email, password });
        try {
            // Backend không tự động login sau khi đăng ký, nên chúng ta sẽ gọi hàm login thủ công
            const registerRes = await axios.post('/api/auth/register', body, config);
            if (registerRes.status === 201) {
                // Đăng nhập ngay sau khi đăng ký thành công
                return await login(email, password);
            }
            return { success: false, message: 'Đăng ký thất bại.'};
        } catch (err) {
            if (err.response && err.response.data) {
                return { success: false, message: err.response.data.msg || 'Đã xảy ra lỗi' };
            } else {
                return { success: false, message: 'Không thể kết nối đến server.' };
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuthToken(null); // Xóa header
        setAuth({ token: null, isAuthenticated: false, loading: false, user: null });
    };
    
    return (
        <AuthContext.Provider value={{ ...auth, login, logout, register, loadUser }}>
            {!auth.loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;