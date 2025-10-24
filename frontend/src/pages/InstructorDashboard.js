// src/pages/InstructorDashboard.js
import React from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap'; // <-- THÊM Tabs, Tab
import InstructorCourseManagement from '../components/InstructorCourseManagement';
import SubmissionGradingTab from '../components/SubmissionGradingTab'; // <-- THÊM DÒNG NÀY
import './InstructorDashboard.css';

const InstructorDashboard = () => {
    return (
        <div className="instructor-dashboard">
            <Container fluid>
                <h2 className="text-center mb-4">Trang quản lý Giảng viên</h2>
                <div className="instructor-tabs-container">
                    {/* SỬA ĐỔI: Sử dụng Tabs */}
                    <Tabs defaultActiveKey="courses" id="instructor-dashboard-tabs" fill justify>
                        <Tab eventKey="courses" title="📚 Quản lý Khóa học">
                            <InstructorCourseManagement />
                        </Tab>
                        <Tab eventKey="grading" title="✅ Chấm bài Thực hành">
                            <SubmissionGradingTab />
                        </Tab>
                    </Tabs>
                </div>
            </Container>
        </div>
    );
};

export default InstructorDashboard;