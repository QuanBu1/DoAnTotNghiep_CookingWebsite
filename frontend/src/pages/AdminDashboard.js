// src/pages/AdminDashboard.js

import React from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import UserManagementTab from '../components/UserManagementTab';
import InstructorManagementTab from '../components/InstructorManagementTab';
import CourseManagementTab from '../components/CourseManagementTab';
import CommentManagementTab from '../components/CommentManagementTab';
import RevenueManagementTab from '../components/RevenueManagementTab';
import './AdminDashboard.css'; // 1. Import file CSS mới
import KitchenToolsManagementTab from '../components/KitchenToolsManagementTab'
import OrderManagementTab from '../components/OrderManagementTab';
import ToolRevenueTab from '../components/ToolRevenueTab';
import MessageManagementTab from '../components/MessageManagementTab';
const AdminDashboard = () => {
    return (
        // 2. Sử dụng class mới cho container chính
        <div className="admin-dashboard">
            <Container fluid>
                <h2 className="text-center mb-4">Admin Dashboard</h2>

                {/* 3. Bọc toàn bộ Tabs trong một div container mới */}
                <div className="admin-tabs-container">
                    <Tabs defaultActiveKey="revenue" id="admin-dashboard-tabs" className="mb-3" fill justify>
                        <Tab eventKey="revenue" title="📊 Doanh thu & Thống kê">
                            <RevenueManagementTab />
                        </Tab>
                        <Tab eventKey="tool-revenue" title="🔪 Doanh thu Dụng cụ">
                            <ToolRevenueTab />
                        </Tab>
                        {/* 2. THÊM TAB MỚI Ở ĐÂY và đặt làm mặc định */}
                        <Tab eventKey="messages" title="✉️ Hộp thư Liên hệ">
                            <MessageManagementTab />
                        </Tab>
                        <Tab eventKey="orders" title="📦 Quản lý Đơn hàng">
                            <OrderManagementTab />
                        </Tab>
                        <Tab eventKey="users" title="👥 Quản lý Người dùng">
                            <UserManagementTab />
                        </Tab>
                        <Tab eventKey="instructors" title="👩‍🏫 Quản lý Giảng viên">
                            <InstructorManagementTab />
                        </Tab>
                        <Tab eventKey="courses" title="📚 Quản lý Khóa học">
                            <CourseManagementTab />
                        </Tab>
                        <Tab eventKey="tools" title="🔪 Quản lý Dụng cụ"> {/* THÊM TAB MỚI Ở ĐÂY */}
                            <KitchenToolsManagementTab />
                        </Tab>
                        <Tab eventKey="comments" title="💬 Quản lý Bình luận">
                            <CommentManagementTab />
                        </Tab>
                    </Tabs>
                </div>
            </Container>
        </div>
    );
};

export default AdminDashboard;